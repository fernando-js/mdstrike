<?php
declare(strict_types=1);

const PASSWORD_RESET_MINUTES = 30;
const PASSWORD_RESET_GENERIC_MESSAGE = 'Se o e-mail estiver associado a uma conta, você receberá um link para redefinir a senha.';

function password_reset_ready(): bool {
    $config = configuration();
    $origin = parse_url($config['app_origin']);
    $secureOrigin = ($origin['scheme'] ?? '') === 'https'
        || (development() && ($origin['scheme'] ?? '') === 'http'
            && in_array($origin['host'] ?? '', ['localhost', '127.0.0.1'], true));

    return (development() || $config['db_password'] !== '')
        && $config['smtp_password'] !== ''
        && filter_var($config['smtp_username'], FILTER_VALIDATE_EMAIL) !== false
        && preg_match('/^[a-z0-9.-]+$/iD', (string)$config['smtp_host']) === 1
        && filter_var($config['smtp_port'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 65535]]) !== false
        && in_array($config['smtp_encryption'], development() ? ['ssl', 'tls', 'none'] : ['ssl', 'tls'], true)
        && $secureOrigin
        && filter_var($config['app_origin'], FILTER_VALIDATE_URL) !== false
        && in_array($origin['path'] ?? '', ['', '/'], true)
        && !isset($origin['user']) && !isset($origin['pass'])
        && !isset($origin['query']) && !isset($origin['fragment']);
}

function request_password_reset(array $data): never {
    if (!password_reset_ready()) fail('A recuperação por e-mail está indisponível no momento.', 503);
    $email = strtolower(trim($data['email'] ?? ''));
    if (strlen($email) > 190 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        fail('Informe um e-mail válido.');
    }

    rate_limit('password-reset-ip', 10, 3600);
    if (consume_limit('password-reset-email', 3, 3600, $email) === 0) {
        $userId = query('SELECT id FROM md_users WHERE email = ?', [$email])->fetchColumn();
        $jobKey = hash('sha256', 'password-reset|' . $email);
        $now = time();
        $onDuplicate = database()->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql'
            ? 'ON DUPLICATE KEY UPDATE job_key = job_key'
            : 'ON CONFLICT(job_key) DO NOTHING';
        query(
            "INSERT INTO md_password_reset_requests (job_key, user_id, requested_at, available_at) VALUES (?, ?, ?, ?) $onDuplicate",
            [$jobKey, $userId === false ? null : $userId, $now, $now]
        );
    }

    send_json(['message' => PASSWORD_RESET_GENERIC_MESSAGE], 202);
}

function reset_password(array $data): never {
    rate_limit('password-reset-confirm', 12, 900);
    $invalid = 'Link inválido ou expirado. Solicite um novo link.';
    $token = $data['token'] ?? '';
    $password = $data['password'] ?? '';
    if (!preg_match('/\A[a-f0-9]{64}\z/', $token)) fail($invalid);
    if (strlen($password) < 10 || strlen($password) > 72) fail('Use uma senha de 10 a 72 caracteres.');

    $tokenHash = hash('sha256', $token);
    $db = database();
    $db->beginTransaction();
    try {
        $lock = $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql' ? ' FOR UPDATE' : '';
        $row = query(
            'SELECT r.user_id, r.password_fingerprint, u.password_hash
               FROM md_password_resets r JOIN md_users u ON u.id = r.user_id
              WHERE r.token_hash = ? AND r.expires_at > ?' . $lock,
            [$tokenHash, time()]
        )->fetch();
        if (!$row || !hash_equals($row['password_fingerprint'], hash('sha256', $row['password_hash']))) {
            $db->rollBack();
            fail($invalid);
        }

        $id = (int)$row['user_id'];
        $changed = query(
            'UPDATE md_users SET password_hash = ?, password_changed_at = ? WHERE id = ? AND password_hash = ?',
            [password_hash($password, PASSWORD_DEFAULT), time(), $id, $row['password_hash']]
        )->rowCount();
        if ($changed !== 1) {
            $db->rollBack();
            fail($invalid);
        }
        query('DELETE FROM md_password_resets WHERE user_id = ?', [$id]);
        $db->commit();
    } catch (Throwable $error) {
        if ($db->inTransaction()) $db->rollBack();
        throw $error;
    }

    audit_event('auth.password_reset', $id, $id);
    $sessionEnded = (int)($_SESSION['user_id'] ?? 0) === $id;
    if ($sessionEnded) {
        $_SESSION = [];
        session_regenerate_id(true);
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    send_json(['ok' => true, 'sessionEnded' => $sessionEnded, 'csrf' => $_SESSION['csrf']]);
}
