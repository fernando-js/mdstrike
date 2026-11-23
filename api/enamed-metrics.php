<?php
declare(strict_types=1);

require dirname(__DIR__) . '/app/bootstrap.php';
header_remove('X-Powered-By');
header('Cache-Control: no-store');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    fail('Método não permitido.', 405);
}
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== configuration()['app_origin']) fail('Origem não permitida.', 403);
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 256) fail('Requisição muito grande.', 413);
$data = input();
$event = $data['event'] ?? null;
$events = ['entry_view', 'training_click', 'training_view', 'training_start', 'first_answer', 'training_complete', 'review_7d'];
if (count($data) !== 1 || !in_array($event, $events, true)) fail('Evento inválido.');

if (development() || configuration()['db_password']) {
    try {
        rate_limit('enamed-metrics', 120, 60);
        $day = (new DateTimeImmutable('now', new DateTimeZone('America/Sao_Paulo')))->format('Y-m-d');
        $update = database()->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite'
            ? 'ON CONFLICT (event_day, event_name) DO UPDATE SET event_count = event_count + 1'
            : 'ON DUPLICATE KEY UPDATE event_count = event_count + 1';
        query('INSERT INTO md_enamed_metrics (event_day, event_name, event_count) VALUES (?, ?, 1) ' . $update, [$day, $event]);
    } catch (Throwable $error) {
        error_log('Enamed metrics collection failed: ' . $error->getMessage());
        fail('Métricas temporariamente indisponíveis.', 503);
    }
}
http_response_code(204);
