<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/password-reset.php';

if (!password_reset_ready()) exit(0);

require __DIR__ . '/vendor/phpmailer/Exception.php';
require __DIR__ . '/vendor/phpmailer/PHPMailer.php';
require __DIR__ . '/vendor/phpmailer/SMTP.php';

function deliver_password_reset(string $email, string $token, array $config): void {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $config['smtp_host'];
    $mail->Port = (int)$config['smtp_port'];
    $mail->SMTPSecure = $config['smtp_encryption'] === 'none' ? '' : $config['smtp_encryption'];
    $mail->SMTPAutoTLS = $config['smtp_encryption'] !== 'none';
    $mail->SMTPAuth = true;
    $mail->Username = $config['smtp_username'];
    $mail->Password = $config['smtp_password'];
    $mail->Timeout = 12;
    $mail->CharSet = PHPMailer::CHARSET_UTF8;
    $mail->setFrom($config['smtp_username'], 'MD Strike');
    $mail->addAddress($email);
    $mail->Subject = 'Redefina sua senha no MD Strike';
    $link = rtrim($config['app_origin'], '/') . '/#reset-password/' . $token;
    $mail->Body = "Para redefinir sua senha, abra este link:\n\n$link\n\n"
        . 'O link vale por ' . PASSWORD_RESET_MINUTES . " minutos e pode ser usado uma vez.\n"
        . "Se você não solicitou a redefinição, ignore este e-mail.\n";
    $mail->send();
}

function send_queued_password_resets(): void {
    $now = time();
    $lifetime = PASSWORD_RESET_MINUTES * 60;
    $config = configuration();
    query('DELETE FROM md_password_resets WHERE expires_at <= ?', [$now]);
    query('DELETE FROM md_password_reset_requests WHERE requested_at <= ?', [$now - $lifetime]);

    $jobs = query(
        'SELECT job_key, user_id, requested_at, attempts FROM md_password_reset_requests
          WHERE available_at <= ? ORDER BY available_at, requested_at LIMIT 10',
        [$now]
    )->fetchAll();
    foreach ($jobs as $job) {
        $user = $job['user_id'] !== null
            ? query('SELECT id, email, password_hash, password_changed_at FROM md_users WHERE id = ?', [$job['user_id']])->fetch()
            : false;
        if (!$user || (int)$user['password_changed_at'] > (int)$job['requested_at']) {
            query('DELETE FROM md_password_reset_requests WHERE job_key = ?', [$job['job_key']]);
            continue;
        }

        $token = bin2hex(random_bytes(32));
        $digest = hash('sha256', $token);
        $values = [$digest, hash('sha256', $user['password_hash']), time() + $lifetime];
        $onDuplicate = database()->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql'
            ? 'ON DUPLICATE KEY UPDATE token_hash = ?, password_fingerprint = ?, expires_at = ?'
            : 'ON CONFLICT(user_id) DO UPDATE SET token_hash = ?, password_fingerprint = ?, expires_at = ?';
        query(
            "INSERT INTO md_password_resets (user_id, token_hash, password_fingerprint, expires_at) VALUES (?, ?, ?, ?) $onDuplicate",
            [$user['id'], ...$values, ...$values]
        );

        try {
            deliver_password_reset($user['email'], $token, $config);
        } catch (Throwable $error) {
            error_log('MD Strike: falha de envio de recuperação por SMTP.');
            query('DELETE FROM md_password_resets WHERE user_id = ? AND token_hash = ?', [$user['id'], $digest]);
            $attempts = (int)$job['attempts'] + 1;
            if ($attempts < 3) {
                query('UPDATE md_password_reset_requests SET attempts = ?, available_at = ? WHERE job_key = ?',
                    [$attempts, time() + 60 * $attempts, $job['job_key']]);
                continue;
            }
        }
        query('DELETE FROM md_password_reset_requests WHERE job_key = ?', [$job['job_key']]);
    }
}

try {
    database();
    $lock = fopen(private_directory() . '/password-reset.lock', 'c');
    if (!$lock) throw new RuntimeException('Falha ao abrir a trava da fila.');
    if (flock($lock, LOCK_EX | LOCK_NB)) send_queued_password_resets();
    fclose($lock);
} catch (Throwable $error) {
    error_log('MD Strike: falha ao processar a fila de recuperação.');
    exit(1);
}
