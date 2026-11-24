<?php
/**
 * Local development server that mimics the production .htaccess
 * (404 page + status, blocked folders, security headers incl. CSP).
 *   cd tools && npm run serve      ->  http://127.0.0.1:8000
 */
$root = dirname(__DIR__);
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

header("Content-Security-Policy: default-src 'self'; script-src 'self' https://www.googletagmanager.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.google-analytics.com https://*.googletagmanager.com; font-src 'self'; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'");
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');

$notFound = static function () use ($root) {
    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    readfile($root . '/404.html');
    return true;
};

if (preg_match('#(^|/)\.(?!well-known/)#', $path)
    || preg_match('#^/(private|tools|fan-form-flow|scss|node_modules|deploy|css/vendor)(/|$)#', $path)
    || preg_match('#(README\.md|package(-lock)?\.json)$#', $path)) {
    return $notFound();
}
if ($path === '/book.html') {
    header('Location: /apply/', true, 301);
    return true;
}

$file = $root . $path;
if (is_dir($file)) {
    $file = rtrim($file, '/') . '/index.html';
    if (substr($path, -1) !== '/') {
        header('Location: ' . $path . '/', true, 301);
        return true;
    }
}
if (!is_file($file)) {
    return $notFound();
}
if (substr($file, -4) === '.php') {
    chdir(dirname($file));
    require $file;
    return true;
}
// Static files: gzip + caching like production (.htaccess mod_deflate / Cache-Control)
$types = ['css' => 'text/css', 'js' => 'application/javascript', 'html' => 'text/html; charset=utf-8',
          'svg' => 'image/svg+xml', 'json' => 'application/json', 'xml' => 'application/xml',
          'webmanifest' => 'application/manifest+json', 'txt' => 'text/plain'];
$ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
if (isset($types[$ext])) {
    header('Content-Type: ' . $types[$ext]);
    header('Cache-Control: ' . ($ext === 'html' || $ext === 'xml' || $ext === 'txt' ? 'public, max-age=0, must-revalidate' : 'public, max-age=31536000, immutable'));
    $body = file_get_contents($file);
    if (str_contains($_SERVER['HTTP_ACCEPT_ENCODING'] ?? '', 'gzip')) {
        header('Content-Encoding: gzip');
        header('Vary: Accept-Encoding');
        $body = gzencode($body, 6);
    }
    header('Content-Length: ' . strlen($body));
    echo $body;
    return true;
}
if (preg_match('/\.(woff2|png|jpe?g|webp|ico)$/', $file)) {
    header('Cache-Control: public, max-age=31536000, immutable');
}
return false; // let the built-in server send other static files
