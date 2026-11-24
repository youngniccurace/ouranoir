<?php
/**
 * Shared helpers for the site's form handlers (contact.php, apply/process_form.php):
 * JSON responses, input cleaning, validation and spam protection.
 */

declare(strict_types=1);

const OURANOIR_TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function app_config(): array
{
    static $config = null;
    if ($config === null) {
        $config = require __DIR__ . '/config.php';
    }
    return $config;
}

/** Send a JSON response and stop. $errors maps field name => message for inline display. */
function respond(int $status, bool $success, string $message, array $errors = [], array $extra = []): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    $body = ['success' => $success, 'message' => $message];
    if ($errors) {
        $body['errors'] = $errors;
    }
    echo json_encode($body + $extra, JSON_UNESCAPED_UNICODE);
    exit;
}

function require_post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        respond(405, false, 'Only POST requests are allowed.');
    }
    // PHP silently drops all fields when post_max_size is exceeded
    if (empty($_POST) && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
        respond(413, false, 'Your upload is too large. Please use smaller photos.');
    }
}

/** Single-line text: trimmed, control characters removed (prevents email header injection). */
function clean_line($value, int $maxLen = 200): string
{
    $value = is_string($value) ? $value : '';
    $value = (string) preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $value);
    return mb_substr(trim($value), 0, $maxLen);
}

/** Multi-line text: trimmed, newlines kept, other control characters removed. */
function clean_text($value, int $maxLen = 5000): string
{
    $value = is_string($value) ? $value : '';
    $value = str_replace("\r\n", "\n", $value);
    $value = (string) preg_replace('/[\x00-\x09\x0B-\x1F\x7F]+/u', ' ', $value);
    return mb_substr(trim($value), 0, $maxLen);
}

function is_valid_email(string $email): bool
{
    return $email !== '' && strlen($email) <= 254 && filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function client_ip(): string
{
    return (string) ($_SERVER['REMOTE_ADDR'] ?? '');
}

/** Create a private storage directory (with web access denied as a second line of defence). */
function storage_dir(string $sub): string
{
    $root = app_config()['STORAGE_DIR'];
    $dir = $root . trim($sub, '/') . '/';
    if (!is_dir($dir) && !@mkdir($dir, 0750, true) && !is_dir($dir)) {
        respond(500, false, 'Server storage is not available. Please try again later.');
    }
    if (!is_file($root . '.htaccess')) {
        @file_put_contents($root . '.htaccess', "Require all denied\n");
    }
    return $dir;
}

/**
 * Spam protection, in order of cost:
 *  1. honeypot field "website" must be empty
 *  2. time trap: form must have been open for at least MIN_FILL_SECONDS
 *  3. rate limit per IP address and form (accepted submissions only)
 *  4. Cloudflare Turnstile token (only when a secret key is configured)
 */
function check_spam(string $form): void
{
    $config = app_config();

    // 1. Honeypot: pretend success so bots don't learn anything
    if (!empty($_POST['website'])) {
        respond(200, true, 'Thank you! Your submission has been received.');
    }

    // 2. Time trap (form_started = milliseconds since epoch, set by the browser when the form loads)
    $started = (int) ($_POST['form_started'] ?? 0);
    if ($started > 0) {
        $elapsed = microtime(true) - $started / 1000;
        if ($elapsed < $config['MIN_FILL_SECONDS']) {
            respond(429, false, 'That was quick! Please take a moment to check your details and try again.');
        }
    }

    // 3. Rate limit (only accepted submissions count - see record_submission())
    if (rate_limit_hits($form) >= $config['RATE_LIMIT_MAX'] && $config['RATE_LIMIT_MAX'] > 0) {
        respond(429, false, 'Too many submissions from your connection. Please try again in a few minutes.');
    }

    // 4. Cloudflare Turnstile
    $secret = $config['TURNSTILE_SECRET_KEY'];
    if ($secret !== '') {
        $token = (string) ($_POST['cf-turnstile-response'] ?? '');
        if ($token === '' || !verify_turnstile($secret, $token)) {
            respond(422, false, 'Please complete the security check.', ['turnstile' => 'Please complete the security check.']);
        }
    }
}

function rate_limit_file(string $form): string
{
    return storage_dir('ratelimit') . hash('sha256', $form . '|' . client_ip()) . '.json';
}

/** Accepted submissions from this IP for this form within the rate-limit window. */
function rate_limit_hits(string $form): int
{
    $file = rate_limit_file($form);
    if (!is_file($file)) {
        return 0;
    }
    $window = app_config()['RATE_LIMIT_WINDOW'];
    $hits = json_decode((string) file_get_contents($file), true) ?: [];
    return count(array_filter($hits, static fn ($t) => is_int($t) && $t > time() - $window));
}

/** Call after a submission has been accepted, so mistakes don't use up the allowance. */
function record_submission(string $form): void
{
    $file = rate_limit_file($form);
    $window = app_config()['RATE_LIMIT_WINDOW'];
    $hits = is_file($file) ? (json_decode((string) file_get_contents($file), true) ?: []) : [];
    $hits = array_values(array_filter($hits, static fn ($t) => is_int($t) && $t > time() - $window));
    $hits[] = time();
    @file_put_contents($file, json_encode($hits), LOCK_EX);
}

function verify_turnstile(string $secret, string $token): bool
{
    $payload = http_build_query(['secret' => $secret, 'response' => $token, 'remoteip' => client_ip()]);
    $context = stream_context_create(['http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/x-www-form-urlencoded\r\n",
        'content' => $payload,
        'timeout' => 10,
    ]]);
    $result = @file_get_contents(OURANOIR_TURNSTILE_VERIFY_URL, false, $context);
    if ($result === false) {
        error_log('OuraNoir: Turnstile verification request failed');
        return false;
    }
    $data = json_decode($result, true);
    return is_array($data) && !empty($data['success']);
}

/** Send a plain-text notification email. Returns false if not configured or delivery failed. */
function send_notification(string $subject, string $body, string $replyTo): bool
{
    $config = app_config();
    if ($config['NOTIFY_EMAIL'] === '' || $config['FROM_EMAIL'] === '') {
        error_log('OuraNoir: NOTIFY_EMAIL / FROM_EMAIL not configured; notification not sent');
        return false;
    }
    $headers  = "From: OuraNoir Website <{$config['FROM_EMAIL']}>\r\n";
    if (is_valid_email($replyTo)) {
        $headers .= "Reply-To: {$replyTo}\r\n";
    }
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    return @mail($config['NOTIFY_EMAIL'], '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers);
}
