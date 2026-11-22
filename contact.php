<?php
/**
 * OuraNoir - contact form handler (contact.html).
 * Settings and secrets: private/config.php (env vars or private/config.local.php).
 */
declare(strict_types=1);
require __DIR__ . '/private/lib.php';

const CONTACT_SUBJECTS = [
    'General question',
    'Joining as a creator',
    "I'm already a creator with OuraNoir",
    'Business / partnership enquiry',
    'Other',
];

require_post();
check_spam('contact');

// --- Server-side validation (mirrors the browser checks in js/forms.js) ---
$name    = clean_line($_POST['name'] ?? '', 100);
$email   = clean_line($_POST['email'] ?? '', 254);
$subject = clean_line($_POST['subject'] ?? '', 100);
$message = clean_text($_POST['message'] ?? '', 5000);

$errors = [];
if (mb_strlen($name) < 2) {
    $errors['name'] = $name === '' ? 'Please enter your name.' : 'Your name must be at least 2 characters.';
}
if (!is_valid_email($email)) {
    $errors['email'] = $email === '' ? 'Please enter your email address.' : 'Please enter a valid email address, like name@example.com.';
}
if (!in_array($subject, CONTACT_SUBJECTS, true)) {
    $errors['subject'] = 'Please choose a subject from the list.';
}
if (mb_strlen($message) < 10) {
    $errors['message'] = $message === '' ? 'Please enter your message.' : 'Please write a little more (at least 10 characters).';
}
if (($_POST['privacy'] ?? '') !== 'yes') {
    $errors['privacy'] = "Please confirm you've read the Privacy Policy.";
}
if ($errors) {
    respond(422, false, 'Please correct the highlighted fields.', $errors);
}

// --- Store a copy (so nothing is lost if email fails), then notify ---
$id = date('Ymd-His') . '-' . bin2hex(random_bytes(4));
$saved = @file_put_contents(storage_dir('messages') . $id . '.json', json_encode([
    'id' => $id, 'receivedAt' => date('c'), 'name' => $name, 'email' => $email,
    'subject' => $subject, 'message' => $message, 'ip' => client_ip(),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

$mailed = send_notification(
    "Contact form: {$subject} - {$name}",
    "New message from the OuraNoir contact form ({$id}):\n\nName: {$name}\nEmail: {$email}\nSubject: {$subject}\n\n{$message}\n",
    $email
);

if (!$saved && !$mailed) {
    respond(500, false, 'Sorry, your message could not be sent. Please try again later or email us directly.');
}
record_submission('contact');
respond(200, true, "Thanks, {$name}! Your message has been sent. We'll reply within 2–3 business days.");
