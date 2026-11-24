<?php
/**
 * OuraNoir - model application handler (apply/).
 *
 * Receives the multi-step application from the React app, validates every
 * field server-side, stores the application + images in private storage
 * and emails a notification.
 *
 * Settings and secrets live in private/config.php (environment variables or
 * private/config.local.php) - never in this file or in front-end code.
 */
declare(strict_types=1);
require __DIR__ . '/../private/lib.php';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // per file; matches the form
const MAX_PHOTOS = 5;
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif',
    'image/heic' => 'heic',
    'image/heif' => 'heif',
];
const EXPERIENCE_LEVELS = ['new', 'beginner', 'intermediate', 'experienced', 'veteran'];
const AVAILABILITY = ['1-5', '5-10', '10-20', '20-30', '30+'];
const CONTENT_TYPES = ['Photos', 'Videos', 'Live Streaming', 'Messaging', 'Custom Content'];

require_post();
check_spam('apply');

// ---------------------------------------------------------------------------
// Read + validate fields (mirrors the browser checks in fan-form-flow/src/lib/validation.ts)
// ---------------------------------------------------------------------------
$data = [
    'firstName'       => clean_line($_POST['firstName'] ?? '', 100),
    'lastName'        => clean_line($_POST['lastName'] ?? '', 100),
    'stageName'       => clean_line($_POST['stageName'] ?? '', 100),
    'dateOfBirth'     => clean_line($_POST['dateOfBirth'] ?? '', 20),
    'email'           => clean_line($_POST['email'] ?? '', 254),
    'phone'           => clean_line($_POST['phone'] ?? '', 40),
    'location'        => clean_line($_POST['location'] ?? '', 150),
    'aboutYou'        => clean_text($_POST['aboutYou'] ?? '', 2000),
    'instagram'       => clean_line($_POST['instagram'] ?? '', 200),
    'twitter'         => clean_line($_POST['twitter'] ?? '', 200),
    'tiktok'          => clean_line($_POST['tiktok'] ?? '', 200),
    'onlyfans'        => clean_line($_POST['onlyfans'] ?? '', 200),
    'otherPlatforms'  => clean_text($_POST['otherPlatforms'] ?? '', 1000),
    'followersCount'  => clean_line($_POST['followersCount'] ?? '', 50),
    'experienceLevel' => clean_line($_POST['experienceLevel'] ?? '', 50),
    'contentTypes'    => clean_line($_POST['contentTypes'] ?? '', 500),
    'availability'    => clean_line($_POST['availability'] ?? '', 50),
    'goalsOnPlatform' => clean_text($_POST['goalsOnPlatform'] ?? '', 2000),
];

$errors = [];
foreach (['firstName' => 'first name', 'lastName' => 'last name'] as $field => $label) {
    if ($data[$field] === '') {
        $errors[$field] = "Please enter your {$label}.";
    }
}

$dob = DateTime::createFromFormat('!Y-m-d', $data['dateOfBirth']);
$today = new DateTime('today');
if ($data['dateOfBirth'] === '') {
    $errors['dateOfBirth'] = 'Please enter your date of birth.';
} elseif (!$dob || $dob > $today || $dob < new DateTime('1900-01-01')) {
    $errors['dateOfBirth'] = 'Please enter a valid date of birth.';
} elseif ($dob->diff($today)->y < 18) {
    $errors['dateOfBirth'] = 'You must be at least 18 years old to apply.';
}

if (!is_valid_email($data['email'])) {
    $errors['email'] = $data['email'] === '' ? 'Please enter your email address.' : 'Please enter a valid email address, like name@example.com.';
}

$phoneDigits = preg_replace('/\D+/', '', $data['phone']);
if ($data['phone'] === '') {
    $errors['phone'] = 'Please enter your phone number.';
} elseif (!preg_match('/^\+?[0-9\s().-]+$/', $data['phone']) || strlen($phoneDigits) < 7 || strlen($phoneDigits) > 15) {
    $errors['phone'] = 'Please enter a valid phone number, including country code (e.g. +254 712 345 678).';
}

if ($data['followersCount'] !== '' && !preg_match('/^[0-9][0-9,.\sKkMm+]*$/', $data['followersCount'])) {
    $errors['followersCount'] = 'Please enter a number, e.g. 12,500 or 12.5K.';
}
if (!in_array($data['experienceLevel'], EXPERIENCE_LEVELS, true)) {
    $errors['experienceLevel'] = 'Please choose your experience level.';
}
if (!in_array($data['availability'], AVAILABILITY, true)) {
    $errors['availability'] = 'Please choose your weekly availability.';
}
if ($data['contentTypes'] !== '') {
    $types = array_map('trim', explode(',', $data['contentTypes']));
    if (array_diff($types, CONTENT_TYPES)) {
        $errors['contentTypes'] = 'Please choose content types from the list.';
    }
}
foreach (['agreeTerms', 'agreeContact', 'confirmAccurate'] as $field) {
    if (($_POST[$field] ?? '') !== 'true') {
        $errors[$field] = 'Please confirm this to submit your application.';
    }
}

// ---------------------------------------------------------------------------
// Validate uploads (images only; file names are generated, never taken from
// the user, so nothing executable can ever be stored)
// ---------------------------------------------------------------------------
$finfo = new finfo(FILEINFO_MIME_TYPE);

/** Returns [tmp_name, extension] for a valid image upload, or an error string. */
function check_upload(array $file, finfo $finfo)
{
    $error = $file['error'] ?? UPLOAD_ERR_NO_FILE;
    if ($error === UPLOAD_ERR_INI_SIZE || $error === UPLOAD_ERR_FORM_SIZE || ($file['size'] ?? 0) > MAX_FILE_SIZE) {
        return 'is larger than 10MB';
    }
    if ($error !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
        return 'could not be uploaded';
    }
    $mime = $finfo->file($file['tmp_name']);
    if (!isset(ALLOWED_IMAGE_TYPES[$mime])) {
        return 'is not a supported image (use JPG, PNG or WEBP)';
    }
    return [$file['tmp_name'], ALLOWED_IMAGE_TYPES[$mime]];
}

$photos = [];
if (isset($_FILES['photos']) && is_array($_FILES['photos']['name'])) {
    $count = count($_FILES['photos']['name']);
    if ($count > MAX_PHOTOS) {
        $errors['photos'] = 'Please upload no more than ' . MAX_PHOTOS . ' photos.';
    }
    for ($i = 0; $i < min($count, MAX_PHOTOS); $i++) {
        $result = check_upload([
            'tmp_name' => $_FILES['photos']['tmp_name'][$i],
            'error'    => $_FILES['photos']['error'][$i],
            'size'     => $_FILES['photos']['size'][$i],
        ], $finfo);
        if (is_string($result)) {
            $errors['photos'] = 'Photo ' . ($i + 1) . ' ' . $result . '.';
            break;
        }
        $photos[] = $result;
    }
}
if (!$photos && !isset($errors['photos'])) {
    $errors['photos'] = 'Please upload at least one photo.';
}

$idUpload = isset($_FILES['idDocument']) ? check_upload($_FILES['idDocument'], $finfo) : 'is missing';
if (is_string($idUpload)) {
    $errors['idFile'] = $idUpload === 'is missing' ? 'Please upload a photo of your ID.' : "Your ID image {$idUpload}.";
}

if ($errors) {
    respond(422, false, 'Please correct the highlighted fields.', $errors);
}

// ---------------------------------------------------------------------------
// Store application + files in private storage
// ---------------------------------------------------------------------------
$applicationId = date('Ymd-His') . '-' . bin2hex(random_bytes(4));
$dir = storage_dir('applications/' . $applicationId);

$storedPhotos = [];
foreach ($photos as $i => [$tmp, $ext]) {
    $name = 'photo-' . ($i + 1) . '.' . $ext;
    if (move_uploaded_file($tmp, $dir . $name)) {
        $storedPhotos[] = $name;
    }
}
$storedId = 'id-document.' . $idUpload[1];
$idSaved = move_uploaded_file($idUpload[0], $dir . $storedId);

if (!$storedPhotos || !$idSaved) {
    array_map('unlink', glob($dir . '*') ?: []);
    @rmdir($dir);
    respond(500, false, 'Your files could not be saved. Please try again later.');
}

file_put_contents($dir . 'application.json', json_encode($data + [
    'applicationId' => $applicationId,
    'submittedAt'   => date('c'),
    'photos'        => $storedPhotos,
    'idDocument'    => $storedId,
    'ip'            => client_ip(),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// ---------------------------------------------------------------------------
// Email notification (the application is already saved even if this fails)
// ---------------------------------------------------------------------------
$na = static fn (string $v): string => $v !== '' ? $v : 'N/A';
$message  = "New application received ({$applicationId}):\n\n";
$message .= "Name: {$data['firstName']} {$data['lastName']}\n";
$message .= 'Stage Name: ' . $na($data['stageName']) . "\n";
$message .= "Email: {$data['email']}\nPhone: {$data['phone']}\n";
$message .= 'Location: ' . $na($data['location']) . "\n";
$message .= "Date of Birth: {$data['dateOfBirth']}\n";
$message .= "Experience Level: {$data['experienceLevel']}\n";
$message .= "Availability: {$data['availability']} hours per week\n";
$message .= 'About: ' . $na($data['aboutYou']) . "\n\n";
$message .= "SOCIAL MEDIA:\n";
foreach (['instagram' => 'Instagram', 'twitter' => 'Twitter/X', 'tiktok' => 'TikTok', 'onlyfans' => 'OnlyFans', 'otherPlatforms' => 'Other', 'followersCount' => 'Followers'] as $key => $label) {
    $message .= "{$label}: " . $na($data[$key]) . "\n";
}
$message .= "\nContent Types: " . $na($data['contentTypes']) . "\n";
$message .= 'Goals: ' . $na($data['goalsOnPlatform']) . "\n\n";
$message .= "FILES (in private storage, applications/{$applicationId}/):\n";
$message .= 'Photos: ' . implode(', ', $storedPhotos) . "\nID document: {$storedId}\n";

send_notification("New Model Application: {$data['firstName']} {$data['lastName']}", $message, $data['email']);

record_submission('apply');
respond(200, true, 'Application submitted successfully!', [], [
    'data' => ['applicationId' => $applicationId, 'applicationDate' => date('Y-m-d H:i:s')],
]);
