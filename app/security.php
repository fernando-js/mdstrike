<?php
declare(strict_types=1);

// Validate routing before opening sessions or the database. Invalid traffic must
// produce a client error, not a persistent exception/audit entry.
function guard_request(): void {
    if (strlen($_SERVER['QUERY_STRING'] ?? '') > 4096) fail('Endereço muito longo.', 414);
    foreach ($_GET as $value) if (!is_string($value) || strlen($value) > 256 || !mb_check_encoding($value, 'UTF-8')) fail('Parâmetro inválido.');
    $action = $_GET['action'] ?? 'session';
    $reads = ['session','catalog','profile','challenge','my-challenges','leaderboard','revalida-comparison','admin-overview','admin-users','admin-user','admin-matches','admin-challenges','admin-logs'];
    $writes = ['register','login','logout','update-profile','save-avatar','change-password','start-match','answer','next-question','abort-match','create-challenge','join-challenge','revalida-mark','revalida-submit'];
    if (!in_array($action, array_merge($reads, $writes), true)) fail('Rota não encontrada.', 404);
    $expected = in_array($action, $reads, true) ? 'GET' : 'POST';
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $expected) {
        header('Allow: ' . $expected); fail('Método não permitido.', 405);
    }
}

// A timestamp alone includes forfeits. Both database drivers support these JSON
// functions. CASE keeps malformed historical JSON out of the parser and ranking.
function completed_match_filter(): string {
    $sqlite = database()->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
    $validWin = $sqlite ? "JSON_TYPE(m.result_json, '$.win') IN ('true','false')" : "JSON_TYPE(JSON_EXTRACT(m.result_json, '$.win')) = 'BOOLEAN'";
    $notAborted = $sqlite ? "COALESCE(JSON_EXTRACT(m.result_json, '$.aborted'),0) = 0" : "COALESCE(JSON_UNQUOTE(JSON_EXTRACT(m.result_json, '$.aborted')),'false') IN ('false','0')";
    return "m.finished_at IS NOT NULL AND CASE WHEN JSON_VALID(m.result_json) THEN $validWin AND $notAborted AND JSON_EXTRACT(m.result_json, '$.answered') > 0 ELSE 0 END";
}

function limit_key(string $name, ?string $subject = null): string {
    return hash('sha256', $name . '|' . ($subject ?? ($_SERVER['REMOTE_ADDR'] ?? 'local')));
}

// Atomically create/increment a bucket, avoiding a read-then-insert race for new
// IPs/accounts. Blocked requests remain capped instead of overflowing the counter.
function consume_limit(string $name, int $max, int $seconds, ?string $subject = null): int {
    $db = database(); $key = limit_key($name, $subject); $now = time(); $cutoff = $now - $seconds;
    $db->beginTransaction();
    try {
        if ($db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql') {
            query('INSERT INTO md_auth_limits (bucket,attempts,window_start) VALUES (?,1,?) ON DUPLICATE KEY UPDATE attempts = IF(window_start <= ?,1,LEAST(attempts + 1,CAST(? AS UNSIGNED))), window_start = IF(window_start <= ?,?,window_start)', [$key,$now,$cutoff,$max+1,$cutoff,$now]);
        } else {
            query('INSERT INTO md_auth_limits (bucket,attempts,window_start) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET attempts = CASE WHEN window_start <= ? THEN 1 ELSE MIN(attempts + 1,CAST(? AS INTEGER)) END, window_start = CASE WHEN window_start <= ? THEN ? ELSE window_start END', [$key,$now,$cutoff,$max+1,$cutoff,$now]);
        }
        $row = query('SELECT attempts,window_start FROM md_auth_limits WHERE bucket = ?', [$key])->fetch();
        $db->commit();
        return (int)$row['attempts'] > $max ? max(1, $seconds - ($now - (int)$row['window_start'])) : 0;
    } catch (Throwable $error) { if ($db->inTransaction()) $db->rollBack(); throw $error; }
}

function security_indexes(PDO $db): void {
    $name = 'security_limits_index_20261117';
    $read = $db->prepare('SELECT name FROM md_migrations WHERE name = ?'); $read->execute([$name]);
    if ($read->fetchColumn()) return;
    $sqlite = $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
    if ($sqlite) $db->exec('CREATE INDEX IF NOT EXISTS md_limits_window ON md_auth_limits(window_start)');
    else {
        $index = $db->query("SHOW INDEX FROM md_auth_limits WHERE Key_name = 'md_limits_window'")->fetch();
        if (!$index) {
            try { $db->exec('CREATE INDEX md_limits_window ON md_auth_limits(window_start)'); }
            catch (PDOException $error) { if ((int)($error->errorInfo[1] ?? 0) !== 1061) throw $error; }
        }
    }
    $sql = $sqlite ? 'INSERT OR IGNORE INTO md_migrations (name,applied_at) VALUES (?,?)' : 'INSERT IGNORE INTO md_migrations (name,applied_at) VALUES (?,?)';
    $db->prepare($sql)->execute([$name,time()]);
}

// Small indexed batches, once per ten minutes across all PHP workers. Retains
// the last 90 days of audit activity; user profiles, answers and matches stay intact.
function security_maintenance(): void {
    try {
        $db = database(); $now = time();
        $last = query('SELECT applied_at FROM md_migrations WHERE name = ?', ['security_housekeeping'])->fetchColumn();
        if ($last !== false && (int)$last > $now-600) return;
        $sql = $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite' ? 'INSERT OR IGNORE INTO md_migrations (name,applied_at) VALUES (?,0)' : 'INSERT IGNORE INTO md_migrations (name,applied_at) VALUES (?,0)';
        query($sql, ['security_housekeeping']);
        $claim = query('UPDATE md_migrations SET applied_at = ? WHERE name = ? AND applied_at <= ?', [$now,'security_housekeeping',$now-600]);
        if (!$claim->rowCount()) return;
        $ids = query('SELECT id FROM md_audit_logs WHERE created_at < ? ORDER BY created_at,id LIMIT 1000', [$now-90*86400])->fetchAll(PDO::FETCH_COLUMN);
        if ($ids) query('DELETE FROM md_audit_logs WHERE id IN (' . implode(',', array_fill(0,count($ids),'?')) . ')', $ids);
        $keys = query('SELECT bucket FROM md_auth_limits WHERE window_start < ? ORDER BY window_start LIMIT 1000', [$now-2*86400])->fetchAll(PDO::FETCH_COLUMN);
        if ($keys) query('DELETE FROM md_auth_limits WHERE bucket IN (' . implode(',', array_fill(0,count($keys),'?')) . ') AND window_start < ?', [...$keys,$now-2*86400]);
    } catch (Throwable $error) { error_log('MD Strike: security maintenance could not finish.'); }
}
