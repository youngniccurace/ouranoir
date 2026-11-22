<?php
/**
 * Server-side configuration loader.
 *
 * Secrets and settings are NEVER stored in front-end code or committed to git.
 * Each value is read from (in order of priority):
 *   1. an environment variable (e.g. set in your hosting control panel / PHP-FPM pool), or
 *   2. private/config.local.php  (copy config.example.php -> config.local.php; it is git-ignored)
 *   3. the safe default below.
 */

$local = is_file(__DIR__ . '/config.local.php') ? (require __DIR__ . '/config.local.php') : [];
if (!is_array($local)) {
    $local = [];
}

$setting = static function (string $key, $default = null) use ($local) {
    $env = getenv('OURANOIR_' . $key);
    if ($env !== false && $env !== '') {
        return $env;
    }
    return array_key_exists($key, $local) ? $local[$key] : $default;
};

return [
    // Where notifications about new applications / messages are sent
    'NOTIFY_EMAIL'         => $setting('NOTIFY_EMAIL', ''),
    // Sender address. Must be a mailbox on your own domain or mail may be rejected as spam
    'FROM_EMAIL'           => $setting('FROM_EMAIL', ''),
    // Where applications, uploads and messages are stored. Best OUTSIDE the public web root.
    'STORAGE_DIR'          => rtrim($setting('STORAGE_DIR', __DIR__ . '/storage'), '/') . '/',
    // Cloudflare Turnstile secret key (spam protection). Empty = Turnstile check disabled.
    'TURNSTILE_SECRET_KEY' => $setting('TURNSTILE_SECRET_KEY', ''),
    // Reject forms submitted faster than this (bots fill forms instantly)
    'MIN_FILL_SECONDS'     => (int) $setting('MIN_FILL_SECONDS', 3),
    // Max submissions per IP address per form in the time window below
    'RATE_LIMIT_MAX'       => (int) $setting('RATE_LIMIT_MAX', 5),
    'RATE_LIMIT_WINDOW'    => (int) $setting('RATE_LIMIT_WINDOW', 600),
];
