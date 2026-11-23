<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/challenges.php';

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

function challenge_invite_error(int $status, string $message): never {
    http_response_code($status);
    echo '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<title>Convite de desafio | MD Strike</title><link rel="stylesheet" href="/assets/style.css?v=3.7.1">'
        . '<main class="public-content"><section class="public-intro"><h1>' . h($message)
        . '</h1><a class="btn" href="/">Ir para o MDStrike</a></section></main></html>';
    exit;
}

if (!preg_match('~\A/d/([a-f0-9]{32})/?\z~', $path, $match)) {
    challenge_invite_error(404, 'Convite de desafio não encontrado.');
}

try {
    $challenge = find_challenge($match[1]);
    if (!$challenge) challenge_invite_error(404, 'Convite de desafio não encontrado.');
    $invite = challenge_invite($challenge);
    $image = rtrim(configuration()['app_origin'], '/') . '/assets/images/hospital.jpg';
    $template = file_get_contents(dirname(__DIR__) . '/index.html');
    if ($template === false) throw new RuntimeException('challenge_invite_template_missing');
} catch (Throwable $error) {
    error_log('MD Strike: challenge invite page could not load.');
    challenge_invite_error(503, 'O convite está temporariamente indisponível.');
}

$title = h($invite['title']);
$description = h($invite['description']);
$url = h($invite['url']);
$image = h($image);
$metadata = <<<HTML
<base href="/">
    <title>$title | MD Strike</title>
    <meta name="description" content="$description">
    <link rel="canonical" href="$url">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="MD Strike">
    <meta property="og:locale" content="pt_BR">
    <meta property="og:title" content="$title">
    <meta property="og:description" content="$description">
    <meta property="og:url" content="$url">
    <meta property="og:image" content="$image">
    <meta property="og:image:alt" content="Ambiente hospitalar ilustrativo">
    <meta name="twitter:card" content="summary_large_image">
HTML;

$sections = [
    'page-meta' => $metadata,
    'page-intro' => '<section class="public-intro"><h1>' . $title . '</h1><p>' . $description . '</p></section>',
];
echo preg_replace_callback('~<!-- (page-meta|page-intro):start -->.*?<!-- \1:end -->~s', static fn (array $part) => $sections[$part[1]], $template);
