<?php
declare(strict_types=1);
require_once __DIR__ . '/security.php';

function private_directory(): string {
    $directory = getenv('MDSTRIKE_PRIVATE_DIR') ?: dirname(__DIR__, 2) . '/.mdstrike';
    return str_starts_with($directory, '/') ? $directory : dirname(__DIR__) . '/' . $directory;
}

function configuration(): array {
    $path = private_directory() . '/config.php';
    $file = is_file($path) ? require $path : [];
    $envPath = private_directory() . '/.env';
    $env = is_file($envPath) ? (parse_ini_file($envPath, false, INI_SCANNER_RAW) ?: []) : [];
    foreach (['DB_HOST'=>'db_host','DB_PORT'=>'db_port','DB_NAME'=>'db_name','DB_USER'=>'db_user','DB_PASSWORD'=>'db_password','APP_ORIGIN'=>'app_origin'] as $key=>$setting) {
        if (array_key_exists($key,$env)) $file[$setting]=$env[$key];
    }
    return array_merge([
        'db_driver' => getenv('MDSTRIKE_DB_DRIVER') ?: 'mysql',
        'db_host' => getenv('DB_HOST') ?: '127.0.0.1',
        'db_port' => (int)(getenv('DB_PORT') ?: 3306),
        'db_name' => getenv('DB_NAME') ?: 'u586486438_mdstrike_db',
        'db_user' => getenv('DB_USER') ?: 'u586486438_mdstrike_user',
        'db_password' => getenv('DB_PASSWORD') ?: '',
        'app_origin' => getenv('APP_ORIGIN') ?: (development() ? 'http://127.0.0.1:8088' : 'https://mdstrike.com'),
    ], $file);
}

function development(): bool { return getenv('MDSTRIKE_ENV') === 'development'; }

function database(): PDO {
    static $pdo;
    if ($pdo) return $pdo;
    $c = configuration();
    if ($c['db_driver'] === 'sqlite' && development()) {
        if (!is_dir(private_directory())) mkdir(private_directory(), 0700, true);
        $pdo = new PDO('sqlite:' . private_directory() . '/mdstrike.sqlite');
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA busy_timeout = 5000');
    } else {
        if (!$c['db_password']) throw new RuntimeException('database_not_configured');
        $pdo = new PDO('mysql:host=' . $c['db_host'] . ';port=' . $c['db_port'] . ';dbname=' . $c['db_name'] . ';charset=utf8mb4', $c['db_user'], $c['db_password'], [PDO::ATTR_EMULATE_PREPARES => false]);
    }
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    migrate($pdo);
    return $pdo;
}

function migrate(PDO $db): void {
    $sqlite = $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
    $id = $sqlite ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT';
    $tail = $sqlite ? '' : ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
    $matchIndexes = $sqlite ? '' : ', INDEX md_matches_user (user_id, finished_at)';
    $answerIndexes = $sqlite ? '' : ', INDEX md_answers_user (user_id, question_id, id)';
    $auditIndexes = $sqlite ? '' : ', INDEX md_audit_time (created_at, id), INDEX md_audit_subject (subject_id, id), INDEX md_audit_actor (actor_id, id)';
    $queries = [
        "CREATE TABLE IF NOT EXISTS md_users (id $id, nickname VARCHAR(24) NOT NULL UNIQUE, email VARCHAR(190) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, specialty VARCHAR(90) NOT NULL DEFAULT '', institution VARCHAR(100) NOT NULL DEFAULT '', status VARCHAR(16) NOT NULL DEFAULT 'available', xp INTEGER NOT NULL DEFAULT 0, points INTEGER NOT NULL DEFAULT 0, rating INTEGER NOT NULL DEFAULT 1000, played INTEGER NOT NULL DEFAULT 0, wins INTEGER NOT NULL DEFAULT 0, answered INTEGER NOT NULL DEFAULT 0, correct INTEGER NOT NULL DEFAULT 0, created_at BIGINT NOT NULL, last_seen BIGINT NOT NULL, password_changed_at BIGINT NOT NULL DEFAULT 0)$tail",
        "CREATE TABLE IF NOT EXISTS md_matches (id VARCHAR(64) PRIMARY KEY, user_id BIGINT NOT NULL, mode VARCHAR(20) NOT NULL, map_id VARCHAR(90) NOT NULL, exam_id VARCHAR(90) NOT NULL DEFAULT '', questions_json TEXT NOT NULL, question_index INTEGER NOT NULL DEFAULT 0, score INTEGER NOT NULL DEFAULT 0, correct INTEGER NOT NULL DEFAULT 0, bot_score INTEGER NOT NULL DEFAULT 0, started_at BIGINT NOT NULL, issued_at BIGINT NOT NULL, finished_at BIGINT, result_json TEXT$matchIndexes)$tail",
        "CREATE TABLE IF NOT EXISTS md_answers (id $id, match_id VARCHAR(64) NOT NULL, user_id BIGINT NOT NULL, question_id VARCHAR(100) NOT NULL, area VARCHAR(8) NOT NULL, map_id VARCHAR(90) NOT NULL, choice INTEGER NOT NULL, correct INTEGER NOT NULL, points INTEGER NOT NULL, elapsed INTEGER NOT NULL, created_at BIGINT NOT NULL, UNIQUE(match_id, question_id)$answerIndexes)$tail",
        "CREATE TABLE IF NOT EXISTS md_auth_limits (bucket VARCHAR(190) PRIMARY KEY, attempts INTEGER NOT NULL, window_start BIGINT NOT NULL)$tail",
        "CREATE TABLE IF NOT EXISTS md_challenges (id VARCHAR(32) PRIMARY KEY, creator_id BIGINT NOT NULL, map_id VARCHAR(90) NOT NULL, questions_json TEXT NOT NULL, created_at BIGINT NOT NULL, expires_at BIGINT NOT NULL)$tail",
        "CREATE TABLE IF NOT EXISTS md_challenge_runs (id $id, challenge_id VARCHAR(32) NOT NULL, user_id BIGINT NOT NULL, match_id VARCHAR(64) NOT NULL UNIQUE, UNIQUE(challenge_id, user_id))$tail",
        "CREATE TABLE IF NOT EXISTS md_admins (user_id BIGINT PRIMARY KEY, granted_at BIGINT NOT NULL)$tail",
        "CREATE TABLE IF NOT EXISTS md_migrations (name VARCHAR(100) PRIMARY KEY, applied_at BIGINT NOT NULL)$tail",
        "CREATE TABLE IF NOT EXISTS md_audit_logs (id $id, event VARCHAR(80) NOT NULL, actor_id BIGINT, subject_id BIGINT, metadata_json TEXT NOT NULL, client_ip VARCHAR(45) NOT NULL DEFAULT '', user_agent VARCHAR(255) NOT NULL DEFAULT '', request_id VARCHAR(32) NOT NULL, created_at BIGINT NOT NULL$auditIndexes)$tail",
    ];
    foreach ($queries as $query) $db->exec($query);
    if ($sqlite) {
        $columns = array_column($db->query('PRAGMA table_info(md_matches)')->fetchAll(), 'name');
        if (in_array('cursor',$columns,true)) $db->exec('ALTER TABLE md_matches RENAME COLUMN cursor TO question_index');
        $db->exec('CREATE INDEX IF NOT EXISTS md_matches_user ON md_matches(user_id, finished_at)');
        $db->exec('CREATE INDEX IF NOT EXISTS md_answers_user ON md_answers(user_id, question_id, id)');
        $db->exec('CREATE INDEX IF NOT EXISTS md_audit_time ON md_audit_logs(created_at, id)');
        $db->exec('CREATE INDEX IF NOT EXISTS md_audit_subject ON md_audit_logs(subject_id, id)');
        $db->exec('CREATE INDEX IF NOT EXISTS md_audit_actor ON md_audit_logs(actor_id, id)');
    }
    bootstrap_owner_admin($db);
    security_indexes($db);
}

function query(string $sql, array $params = []): PDOStatement {
    $q = database()->prepare($sql); $q->execute($params); return $q;
}

function send_json(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}

function fail(string $message, int $status = 400): never { send_json(['error' => $message], $status); }

function start_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.use_trans_sid', '0');
    ini_set('session.gc_maxlifetime', '86400');
    session_name('mdstrike_session');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => !development(), 'httponly' => true, 'samesite' => 'Lax']);
    session_start();
    $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
}

function input(): array {
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 32768) fail('Requisição muito grande.', 413);
    if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') fail('Envie os dados em JSON.', 415);
    $raw = file_get_contents('php://input', false, null, 0, 32769);
    if ($raw === false || strlen($raw) > 32768) fail('Requisição muito grande.', 413);
    if (!str_starts_with(ltrim($raw), '{')) fail('Envie um objeto JSON.');
    try { $data = json_decode($raw, true, 32, JSON_THROW_ON_ERROR); }
    catch (JsonException) { fail('JSON inválido.'); }
    if (!is_array($data)) fail('Dados inválidos.');
    foreach ($data as $key => $value) {
        if (is_array($value) || is_object($value)) fail('Campo inválido.');
        if (in_array($key, ['nickname','email','password','currentPassword','specialty','identity','institution','status','mode','map','exam','match','question','challenge'], true) && !is_string($value)) fail('Campo de texto inválido.');
    }
    return $data;
}

function require_csrf(): void {
    if (!hash_equals($_SESSION['csrf'], $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')) fail('Sessão expirada. Atualize a página.', 403);
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = configuration()['app_origin'];
    if ($origin !== '' && $origin !== $allowed && !(development() && in_array($origin, ['http://127.0.0.1:8088','http://localhost:8088'], true))) fail('Origem não permitida.', 403);
}

function current_user(): ?array {
    if (empty($_SESSION['user_id'])) return null;
    $u = query('SELECT * FROM md_users WHERE id = ?', [$_SESSION['user_id']])->fetch();
    if (!$u || !hash_equals(hash('sha256',$u['password_hash']), (string)($_SESSION['password_fingerprint'] ?? ''))) {
        unset($_SESSION['user_id']); return null;
    }
    $now = time();
    $admin = is_admin($u);
    $authenticated = (int)($_SESSION['authenticated_at'] ?? 0);
    $lastActivity = (int)($_SESSION['last_activity'] ?? $now);
    if (!$authenticated || $now - $authenticated >= ($admin ? 28800 : 86400) || $now - $lastActivity >= ($admin ? 1800 : 7200)) {
        audit_event('auth.session_expired', (int)$u['id'], (int)$u['id']);
        $_SESSION = []; session_regenerate_id(true); $_SESSION['csrf'] = bin2hex(random_bytes(32));
        return null;
    }
    $_SESSION['last_activity'] = $now;
    return $u;
}

function require_user(): array { return current_user() ?: fail('Sua sessão expirou ou você não está conectado. Atualize a página e entre novamente.', 401); }

function public_user(array $u, bool $owner = false): array {
    $result = array_intersect_key($u, array_flip(['id','nickname','specialty','institution','status','xp','points','rating','played','wins','answered','correct','created_at','last_seen']));
    foreach (['id','xp','points','rating','played','wins','answered','correct','created_at','last_seen'] as $key) $result[$key] = (int)$result[$key];
    if ($owner) { $result['email'] = $u['email']; $result['isAdmin'] = is_admin($u); }
    $result['rank'] = rank_name((int)$u['rating']);
    return $result;
}

function rank_name(int $rating): string {
    $rank = 'Recruta';
    foreach ([[900,'Prata I'],[1000,'Prata Elite'],[1100,'Ouro I'],[1250,'Ouro Elite'],[1400,'Guardião'],[1600,'Águia'],[1800,'Mestre Supremo'],[2000,'Elite Global']] as [$min,$name]) if ($rating >= $min) $rank = $name;
    return $rank;
}

function rate_limit(string $name, int $max = 10, int $seconds = 900, ?string $subject = null): void {
    $retry = consume_limit($name, $max, $seconds, $subject);
    if ($retry) { header('Retry-After: ' . $retry); fail('Muitas tentativas. Aguarde alguns minutos.', 429); }
}

function catalog(): array { return json_decode(file_get_contents(__DIR__ . '/catalog.json'), true, 512, JSON_THROW_ON_ERROR); }
function question_bank(): array { return json_decode(file_get_contents(__DIR__ . '/questions.json'), true, 512, JSON_THROW_ON_ERROR); }

function question_public(array $q, array $order): array {
    $public = array_intersect_key($q, array_flip(['id','area','prompt','source','kind','specialties','exam','number','pdf','page','reviewed']));
    $public['options'] = array_map(fn($i) => $q['options'][$i], $order);
    return $public;
}

function is_admin(array $user): bool {
    return (bool)query('SELECT user_id FROM md_admins WHERE user_id = ?', [(int)$user['id']])->fetchColumn();
}

function require_admin(): array {
    $user = require_user();
    if (!is_admin($user)) {
        audit_event('admin.denied', (int)$user['id'], null);
        fail('Esta conta não tem permissão de administrador.', 403);
    }
    return $user;
}

function audit_event(string $event, ?int $actor = null, ?int $subject = null, array $metadata = []): void {
    static $requestId;
    $requestId ??= bin2hex(random_bytes(12));
    try {
        if (in_array($event, ['api.error','admin.denied'], true) && consume_limit('audit:' . $event, 5, 60)) return;
        query('INSERT INTO md_audit_logs (event,actor_id,subject_id,metadata_json,client_ip,user_agent,request_id,created_at) VALUES (?,?,?,?,?,?,?,?)', [
            $event,$actor,$subject,json_encode($metadata,JSON_UNESCAPED_UNICODE|JSON_INVALID_UTF8_SUBSTITUTE),
            substr((string)($_SERVER['REMOTE_ADDR']??''),0,45),mb_substr((string)($_SERVER['HTTP_USER_AGENT']??''),0,255),$requestId,time(),
        ]);
    } catch (Throwable $error) { error_log('MD Strike: audit event could not be stored.'); }
}

function bootstrap_owner_admin(PDO $db): void {
    $migration = 'owner_admin_20261117';
    $read = $db->prepare('SELECT name FROM md_migrations WHERE name = ?');
    $read->execute([$migration]); if ($read->fetchColumn()) return;
    // Deployment-only selection of an EXISTING account. Never infer a role at registration.
    $ownerHash = '4789c7a9553d957a6865273071526b4f0636ba79d2852ffe713cef2400650349';
    if (development() && getenv('MDSTRIKE_TEST_ADMIN_HASH')) $ownerHash = getenv('MDSTRIKE_TEST_ADMIN_HASH');
    $db->beginTransaction();
    try {
        $owner=null;
        foreach ($db->query('SELECT id,email FROM md_users')->fetchAll() as $candidate) {
            if (hash_equals($ownerHash, hash('sha256',strtolower(trim($candidate['email']))))) { $owner=(int)$candidate['id']; break; }
        }
        if ($owner !== null) {
            $statement=$db->prepare('INSERT INTO md_admins (user_id,granted_at) VALUES (?,?)');$statement->execute([$owner,time()]);
            $statement=$db->prepare('INSERT INTO md_audit_logs (event,actor_id,subject_id,metadata_json,client_ip,user_agent,request_id,created_at) VALUES (?,NULL,?,?,\'\',\'\',?,?)');
            $statement->execute(['admin.granted',$owner,json_encode(['source'=>'deployment_migration']),bin2hex(random_bytes(12)),time()]);
        }
        $statement=$db->prepare('INSERT INTO md_migrations (name,applied_at) VALUES (?,?)');$statement->execute([$migration,time()]);
        $db->commit();
    } catch (Throwable $error) {
        if ($db->inTransaction()) $db->rollBack();
        $read->execute([$migration]); if (!$read->fetchColumn()) throw $error;
    }
}
