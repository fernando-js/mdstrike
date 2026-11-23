<?php
// Development only. Production uses Apache/LiteSpeed and .htaccess.
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
if (preg_match('~^/(app|scripts|tests|node_modules|release|\.runtime|\.)~', $path)) {
    http_response_code(404); exit('Not found');
}
if ($path === '/sitemap.xml' || preg_match('~^/(d|enamed|enare|revalida|medicina|consulta-clinica|codificacao-em-saude|exames-medicos|cid-10|tea)(/|$)~', $path)) {
    require dirname(__DIR__) . '/exam.php';
    return true;
}
$root = realpath(__DIR__ . '/..');
$file = realpath($root . $path);
if ($path !== '/' && $file && str_starts_with($file, $root . DIRECTORY_SEPARATOR) && is_file($file)) return false;
if ($path === '/') { readfile($root . '/index.html'); return true; }
http_response_code(404); echo 'Not found';
