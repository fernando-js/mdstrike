<?php
declare(strict_types=1);
require dirname(__DIR__) . '/app/bootstrap.php';
require dirname(__DIR__) . '/app/google-auth.php';

ini_set('display_errors', '0');
header_remove('X-Powered-By');
header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');

function finish_google_callback(string $status): never {
    header('Location: /#google-auth/' . $status, true, 303);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    header('Allow: GET');
    http_response_code(405);
    exit;
}

try {
    $config = configuration();
    if (!google_auth_ready($config) || strlen($_SERVER['QUERY_STRING'] ?? '') > 4096) finish_google_callback('error');
    start_session();
    $attempt = google_auth_attempt($_GET['state'] ?? null);
    if (!$attempt) finish_google_callback('error');
    if (($_GET['error'] ?? '') === 'access_denied') finish_google_callback('cancelled');
    $code = $_GET['code'] ?? '';
    if (!is_string($code) || $code === '' || strlen($code) > 2048) finish_google_callback('error');
    $user = current_user();
    if (($user ? (int)$user['id'] : null) !== $attempt['user_id']) finish_google_callback('error');
    $identity = exchange_google_code($config, $attempt, $code);
    finish_google_callback(complete_google_auth($identity, $user));
} catch (Throwable $error) {
    error_log('MD Strike: Google authentication could not finish.');
    finish_google_callback('error');
}
