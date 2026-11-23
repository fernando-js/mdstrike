<?php
declare(strict_types=1);

const GOOGLE_AUTH_LIFETIME = 600;

function google_auth_ready(array $config): bool {
    return function_exists('curl_init')
        && preg_match('/\A[A-Za-z0-9.-]+\.apps\.googleusercontent\.com\z/', $config['google_client_id']) === 1
        && $config['google_client_secret'] !== '';
}

function google_callback_uri(array $config): string {
    return rtrim($config['app_origin'], '/') . '/api/google-callback.php';
}

function start_google_auth(array $data): never {
    $config = configuration();
    if (!google_auth_ready($config)) fail('O acesso com Google está indisponível.', 503);
    rate_limit('google-start', 20, 900);
    $user = current_user();
    if ($user) {
        if (is_admin($user)) fail('O acesso administrativo usa a senha do MDStrike.', 403);
        rate_limit('google-link', 8, 900, 'user:' . $user['id']);
        if (!password_verify($data['currentPassword'] ?? '', $user['password_hash'])) fail('Senha atual incorreta.', 401);
        if (query('SELECT 1 FROM md_google_accounts WHERE user_id = ?', [$user['id']])->fetchColumn()) {
            fail('Esta conta já está vinculada ao Google.', 409);
        }
    }

    unset($_SESSION['google_signup']);
    $attempt = [
        'state' => bin2hex(random_bytes(32)),
        'nonce' => bin2hex(random_bytes(32)),
        'verifier' => bin2hex(random_bytes(32)),
        'expires' => time() + GOOGLE_AUTH_LIFETIME,
        'user_id' => $user ? (int)$user['id'] : null,
    ];
    $_SESSION['google_attempt'] = $attempt;
    $challenge = rtrim(strtr(base64_encode(hash('sha256', $attempt['verifier'], true)), '+/', '-_'), '=');
    $query = http_build_query([
        'client_id' => $config['google_client_id'],
        'redirect_uri' => google_callback_uri($config),
        'response_type' => 'code',
        'scope' => 'openid email',
        'state' => $attempt['state'],
        'nonce' => $attempt['nonce'],
        'code_challenge' => $challenge,
        'code_challenge_method' => 'S256',
        'prompt' => 'select_account',
        'hl' => 'pt-BR',
    ], '', '&', PHP_QUERY_RFC3986);
    send_json(['url' => 'https://accounts.google.com/o/oauth2/v2/auth?' . $query]);
}

function google_auth_attempt(mixed $state): ?array {
    $attempt = $_SESSION['google_attempt'] ?? null;
    if (!$attempt || !is_string($state) || !hash_equals($attempt['state'], $state)) return null;
    unset($_SESSION['google_attempt']);
    return $attempt['expires'] > time() ? $attempt : null;
}

function exchange_google_code(array $config, array $attempt, string $code): array {
    $client = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt_array($client, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query([
            'grant_type' => 'authorization_code',
            'client_id' => $config['google_client_id'],
            'client_secret' => $config['google_client_secret'],
            'redirect_uri' => google_callback_uri($config),
            'code' => $code,
            'code_verifier' => $attempt['verifier'],
        ]),
        CURLOPT_HTTPHEADER => ['Accept: application/json', 'Content-Type: application/x-www-form-urlencoded'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_CONNECTTIMEOUT => 4,
        CURLOPT_TIMEOUT => 10,
    ]);
    $body = curl_exec($client);
    if (!is_string($body) || curl_getinfo($client, CURLINFO_RESPONSE_CODE) !== 200) {
        throw new RuntimeException('google_token_exchange_failed');
    }
    $response = json_decode($body, true, 16, JSON_THROW_ON_ERROR);
    // The token is obtained directly from Google's endpoint over verified TLS.
    // OpenID Connect Core 3.1.3.7 permits this channel to authenticate the issuer.
    return google_token_identity($response['id_token'] ?? null, $config['google_client_id'], $attempt['nonce']);
}

function google_token_identity(mixed $token, string $clientId, string $nonce): array {
    if (!is_string($token) || strlen($token) > 8192 || count($parts = explode('.', $token)) !== 3) {
        throw new RuntimeException('google_token_invalid');
    }
    $payload = base64_decode(strtr($parts[1], '-_', '+/'), true);
    $claims = $payload === false ? null : json_decode($payload, true, 16, JSON_THROW_ON_ERROR);
    $subject = $claims['sub'] ?? null;
    $email = $claims['email'] ?? null;
    if (
        !in_array($claims['iss'] ?? null, ['https://accounts.google.com', 'accounts.google.com'], true)
        || ($claims['aud'] ?? null) !== $clientId
        || (isset($claims['azp']) && $claims['azp'] !== $clientId)
        || ($claims['nonce'] ?? null) !== $nonce
        || !is_int($claims['exp'] ?? null) || $claims['exp'] <= time()
        || !is_int($claims['iat'] ?? null) || $claims['iat'] > time() + 60
        || !is_string($subject) || !preg_match('/\A[A-Za-z0-9_-]{1,255}\z/', $subject)
        || ($claims['email_verified'] ?? null) !== true
        || !is_string($email) || strlen($email) > 190 || !filter_var($email, FILTER_VALIDATE_EMAIL)
    ) {
        throw new RuntimeException('google_claims_invalid');
    }
    $email = strtolower($email);
    return [
        'subject' => $subject,
        'email' => $email,
        'authoritative_email' => str_ends_with($email, '@gmail.com') || (is_string($claims['hd'] ?? null) && $claims['hd'] !== ''),
    ];
}

function complete_google_auth(array $identity, ?array $user): string {
    $linkedUser = query('SELECT u.* FROM md_google_accounts g JOIN md_users u ON u.id = g.user_id WHERE g.google_subject = ?', [$identity['subject']])->fetch();
    if ($user) {
        if (is_admin($user)) return 'error';
        if (strtolower($user['email']) !== $identity['email']) return 'email-mismatch';
        if ($linkedUser && (int)$linkedUser['id'] === (int)$user['id']) return 'linked';
        if ($linkedUser) return 'link-conflict';
        try {
            query('INSERT INTO md_google_accounts (user_id, google_subject, linked_at) VALUES (?, ?, ?)', [$user['id'], $identity['subject'], time()]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') return 'link-conflict';
            throw $error;
        }
        audit_event('auth.google_linked', (int)$user['id'], (int)$user['id']);
        return 'linked';
    }

    if ($linkedUser) {
        if (is_admin($linkedUser)) return 'existing';
        begin_auth($linkedUser, 'google');
        audit_event('auth.login', (int)$linkedUser['id'], (int)$linkedUser['id'], ['method' => 'google']);
        return 'signed-in';
    }
    if (query('SELECT 1 FROM md_users WHERE email = ?', [$identity['email']])->fetchColumn()) return 'existing';
    if (!$identity['authoritative_email']) return 'unverified-email';
    $_SESSION['google_signup'] = [
        'subject' => $identity['subject'],
        'email' => $identity['email'],
        'expires' => time() + GOOGLE_AUTH_LIFETIME,
    ];
    return 'signup';
}

function pending_google_signup(): ?array {
    $signup = $_SESSION['google_signup'] ?? null;
    if ($signup && $signup['expires'] > time() && google_auth_ready(configuration())) return $signup;
    unset($_SESSION['google_signup']);
    return null;
}
