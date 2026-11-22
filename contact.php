<?php
/**
 * OuraNoir - contact form handler (contact.html)
 * Validates the message, saves a copy and emails it to the agency.
 */

// ---------------------------------------------------------------------------
// Configuration (keep in sync with apply/process_form.php)
// ---------------------------------------------------------------------------
$NOTIFY_EMAIL = "you@example.com";        // Where messages are sent
$FROM_EMAIL   = "noreply@ouranoir.com";            // Must be a mailbox on your hosting domain
$STORAGE_DIR  = __DIR__ . "/applications/messages/"; // Private, git-ignored (see .gitignore)
$SUBJECTS = [
    "General question",
    "Joining as a creator",
    "I'm already a creator with OuraNoir",
    "Business / partnership enquiry",
    "Other",
];

header("Content-Type: application/json");

function respond(int $status, bool $success, string $message): void {
    http_response_code($status);
    echo json_encode(["success" => $success, "message" => $message]);
    exit;
}

/** Trim, strip control characters (prevents email header injection), limit length. */
function clean($value, int $maxLen, bool $multiline = false): string {
    $value = is_string($value) ? $value : "";
    $pattern = $multiline ? '/[\x00-\x09\x0B-\x1F\x7F]+/u' : '/[\x00-\x1F\x7F]+/u';
    return mb_substr(trim(preg_replace($pattern, " ", $value)), 0, $maxLen);
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    respond(405, false, "Only POST requests are allowed");
}

// Honeypot: real visitors never fill this hidden field. Pretend success for bots.
if (!empty($_POST["website"])) {
    respond(200, true, "Thanks! Your message has been sent.");
}

$name    = clean($_POST["name"] ?? "", 100);
$email   = clean($_POST["email"] ?? "", 254);
$subject = clean($_POST["subject"] ?? "", 100);
$message = clean($_POST["message"] ?? "", 5000, true);

if ($name === "" || $email === "" || $message === "") {
    respond(422, false, "Please fill in your name, email and message.");
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, false, "Please enter a valid email address.");
}
if (!in_array($subject, $SUBJECTS, true)) {
    $subject = "Other";
}

// Save a copy so nothing is lost if email delivery fails
if (!is_dir($STORAGE_DIR)) {
    @mkdir($STORAGE_DIR, 0750, true);
}
$protectDir = dirname($STORAGE_DIR) . "/";
if (is_dir($protectDir) && !file_exists($protectDir . ".htaccess")) {
    file_put_contents($protectDir . ".htaccess", "Require all denied\nDeny from all\n");
}
$id = date("Ymd-His") . "-" . bin2hex(random_bytes(4));
$saved = @file_put_contents($STORAGE_DIR . $id . ".json", json_encode([
    "id" => $id, "receivedAt" => date("c"), "name" => $name, "email" => $email,
    "subject" => $subject, "message" => $message, "ip" => $_SERVER["REMOTE_ADDR"] ?? "",
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

$body  = "New message from the OuraNoir contact form:\n\n";
$body .= "Name: {$name}\nEmail: {$email}\nSubject: {$subject}\n\n{$message}\n";
$headers  = "From: OuraNoir Website <{$FROM_EMAIL}>\r\n";
$headers .= "Reply-To: {$email}\r\n";   // validated above, cannot contain newlines
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$mailSubject = "=?UTF-8?B?" . base64_encode("Contact form: {$subject} - {$name}") . "?=";
$mailSent = @mail($NOTIFY_EMAIL, $mailSubject, $body, $headers);

if (!$mailSent && !$saved) {
    respond(500, false, "Sorry, your message could not be sent. Please try again later.");
}
if (!$mailSent) {
    error_log("OuraNoir: contact message {$id} saved but email failed");
}

respond(200, true, "Thanks! Your message has been sent. We'll get back to you soon.");
