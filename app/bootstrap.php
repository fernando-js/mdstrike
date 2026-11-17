<?php
declare(strict_types=1);

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
    $queries = [
        "CREATE TABLE IF NOT EXISTS md_users (id $id, nickname VARCHAR(24) NOT NULL UNIQUE, email VARCHAR(190) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, specialty VARCHAR(90) NOT NULL DEFAULT '', institution VARCHAR(100) NOT NULL DEFAULT '', status VARCHAR(16) NOT NULL DEFAULT 'available', xp INTEGER NOT NULL DEFAULT 0, points INTEGER NOT NULL DEFAULT 0, rating INTEGER NOT NULL DEFAULT 1000, played INTEGER NOT NULL DEFAULT 0, wins INTEGER NOT NULL DEFAULT 0, answered INTEGER NOT NULL DEFAULT 0, correct INTEGER NOT NULL DEFAULT 0, created_at BIGINT NOT NULL, last_seen BIGINT NOT NULL, password_changed_at BIGINT NOT NULL DEFAULT 0)$tail",
        "CREATE TABLE IF NOT EXISTS md_matches (id VARCHAR(64) PRIMARY KEY, user_id BIGINT NOT NULL, mode VARCHAR(20) NOT NULL, map_id VARCHAR(90) NOT NULL, exam_id VARCHAR(90) NOT NULL DEFAULT '', questions_json TEXT NOT NULL, question_index INTEGER NOT NULL DEFAULT 0, score INTEGER NOT NULL DEFAULT 0, correct INTEGER NOT NULL DEFAULT 0, bot_score INTEGER NOT NULL DEFAULT 0, started_at BIGINT NOT NULL, issued_at BIGINT NOT NULL, finished_at BIGINT, result_json TEXT$matchIndexes)$tail",
        "CREATE TABLE IF NOT EXISTS md_answers (id $id, match_id VARCHAR(64) NOT NULL, user_id BIGINT NOT NULL, question_id VARCHAR(100) NOT NULL, area VARCHAR(8) NOT NULL, map_id VARCHAR(90) NOT NULL, choice INTEGER NOT NULL, correct INTEGER NOT NULL, points INTEGER NOT NULL, elapsed INTEGER NOT NULL, created_at BIGINT NOT NULL, UNIQUE(match_id, question_id)$answerIndexes)$tail",
        "CREATE TABLE IF NOT EXISTS md_auth_limits (bucket VARCHAR(190) PRIMARY KEY, attempts INTEGER NOT NULL, window_start BIGINT NOT NULL)$tail",
        "CREATE TABLE IF NOT EXISTS md_challenges (id VARCHAR(32) PRIMARY KEY, creator_id BIGINT NOT NULL, map_id VARCHAR(90) NOT NULL, questions_json TEXT NOT NULL, created_at BIGINT NOT NULL, expires_at BIGINT NOT NULL)$tail",
        "CREATE TABLE IF NOT EXISTS md_challenge_runs (id $id, challenge_id VARCHAR(32) NOT NULL, user_id BIGINT NOT NULL, match_id VARCHAR(64) NOT NULL UNIQUE, UNIQUE(challenge_id, user_id))$tail",
    ];
    foreach ($queries as $query) $db->exec($query);
    if ($sqlite) {
        $columns = array_column($db->query('PRAGMA table_info(md_matches)')->fetchAll(), 'name');
        if (in_array('cursor',$columns,true)) $db->exec('ALTER TABLE md_matches RENAME COLUMN cursor TO question_index');
        $db->exec('CREATE INDEX IF NOT EXISTS md_matches_user ON md_matches(user_id, finished_at)');
        $db->exec('CREATE INDEX IF NOT EXISTS md_answers_user ON md_answers(user_id, question_id, id)');
    }
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
    ini_set('session.gc_maxlifetime', '86400');
    session_name('mdstrike_session');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => !development(), 'httponly' => true, 'samesite' => 'Lax']);
    session_start();
    $_SESSION['csrf'] ??= bin2hex(random_bytes(32));
}

function input(): array {
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 32768) fail('Requisição muito grande.', 413);
    try { $data = json_decode(file_get_contents('php://input'), true, 32, JSON_THROW_ON_ERROR); }
    catch (JsonException) { fail('JSON inválido.'); }
    if (!is_array($data)) fail('Dados inválidos.');
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
    return $u;
}

function require_user(): array { return current_user() ?: fail('Entre na sua conta para continuar.', 401); }

function public_user(array $u, bool $owner = false): array {
    $result = array_intersect_key($u, array_flip(['id','nickname','specialty','institution','status','xp','points','rating','played','wins','answered','correct','created_at','last_seen']));
    foreach (['id','xp','points','rating','played','wins','answered','correct','created_at','last_seen'] as $key) $result[$key] = (int)$result[$key];
    if ($owner) $result['email'] = $u['email'];
    $result['rank'] = rank_name((int)$u['rating']);
    return $result;
}

function rank_name(int $rating): string {
    $rank = 'Recruta';
    foreach ([[900,'Prata I'],[1000,'Prata Elite'],[1100,'Ouro I'],[1250,'Ouro Elite'],[1400,'Guardião'],[1600,'Águia'],[1800,'Mestre Supremo'],[2000,'Elite Global']] as [$min,$name]) if ($rating >= $min) $rank = $name;
    return $rank;
}

function rate_limit(string $name, int $max = 10, int $seconds = 900): void {
    $key = hash('sha256', $name . '|' . ($_SERVER['REMOTE_ADDR'] ?? 'local'));
    $db = database(); $db->beginTransaction();
    try {
        $suffix = $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql' ? ' FOR UPDATE' : '';
        $row = query('SELECT * FROM md_auth_limits WHERE bucket = ?' . $suffix, [$key])->fetch();
        if (!$row) query('INSERT INTO md_auth_limits (bucket, attempts, window_start) VALUES (?, 1, ?)', [$key, time()]);
        elseif (time() - (int)$row['window_start'] >= $seconds) query('UPDATE md_auth_limits SET attempts = 1, window_start = ? WHERE bucket = ?', [time(), $key]);
        elseif ((int)$row['attempts'] >= $max) { $db->rollBack(); fail('Muitas tentativas. Aguarde alguns minutos.', 429); }
        else query('UPDATE md_auth_limits SET attempts = attempts + 1 WHERE bucket = ?', [$key]);
        $db->commit();
    } catch (Throwable $e) { if ($db->inTransaction()) $db->rollBack(); throw $e; }
}

function catalog(): array { return json_decode(file_get_contents(__DIR__ . '/catalog.json'), true, 512, JSON_THROW_ON_ERROR); }
function question_bank(): array { return json_decode(file_get_contents(__DIR__ . '/questions.json'), true, 512, JSON_THROW_ON_ERROR); }

function question_public(array $q, array $order): array {
    $public = array_intersect_key($q, array_flip(['id','area','prompt','source','kind','specialties','exam','number','pdf','page','reviewed']));
    $public['options'] = array_map(fn($i) => $q['options'][$i], $order);
    return $public;
}
