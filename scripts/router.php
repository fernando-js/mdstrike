<?php
// Development only. Production uses Apache/LiteSpeed and .htaccess.
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
if (preg_match('~^/(app|scripts|tests|node_modules|release|\.runtime|\.)~', $path)) {
    http_response_code(404); exit('Not found');
}
$root = realpath(__DIR__ . '/..');
$file = realpath($root . $path);
if ($path !== '/' && $file && str_starts_with($file, $root . DIRECTORY_SEPARATOR) && is_file($file)) return false;
if ($path === '/') { readfile($root . '/index.html'); return true; }
http_response_code(404); echo 'Not found';
