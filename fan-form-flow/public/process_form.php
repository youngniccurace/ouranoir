<?php
/**
 * OuraNoir - model application handler
 *
 * Receives the multi-step application form from apply/ (fan-form-flow),
 * stores the application + uploaded images in a protected folder and
 * emails a notification to the agency.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
$NOTIFY_EMAIL = "you@example.com";        // Where new applications are sent
$FROM_EMAIL   = "noreply@ouranoir.com";            // Must be a mailbox on your hosting domain
// Where applications and uploads are stored. Ideally move this OUTSIDE the
// public web root (e.g. __DIR__ . "/../../applications/"). If it stays inside,
// the generated .htaccess blocks web access on Apache hosts. It is kept
// outside apply/ because rebuilding the form app empties that folder.
$STORAGE_DIR  = __DIR__ . "/../applications/";
$MAX_FILE_SIZE = 10 * 1024 * 1024;                 // 10MB per file (matches the form)
$MAX_PHOTOS    = 5;
$ALLOWED_TYPES = [
    "image/jpeg" => "jpg",
    "image/png"  => "png",
    "image/webp" => "webp",
    "image/gif"  => "gif",
    "image/heic" => "heic",
    "image/heif" => "heif",
];

header("Content-Type: application/json");

function respond(int $status, bool $success, string $message, array $extra = []): void {
    http_response_code($status);
    echo json_encode(array_merge(["success" => $success, "message" => $message], $extra));
    exit;
}

/** Single-line text: trimmed, no control characters (prevents email header injection). */
function clean_line($value, int $maxLen = 200): string {
    $value = is_string($value) ? $value : "";
    $value = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $value);
    return mb_substr(trim($value), 0, $maxLen);
}

/** Multi-line text: trimmed, keeps newlines, strips other control characters. */
function clean_text($value, int $maxLen = 5000): string {
    $value = is_string($value) ? $value : "";
    $value = preg_replace('/[\x00-\x09\x0B-\x1F\x7F]+/u', ' ', $value);
    return mb_substr(trim($value), 0, $maxLen);
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    respond(405, false, "Only POST requests are allowed");
}

// PHP drops $_POST/$_FILES entirely when post_max_size is exceeded
if (empty($_POST) && (int)($_SERVER["CONTENT_LENGTH"] ?? 0) > 0) {
    respond(413, false, "Upload too large. Please use smaller photos.");
}

// ---------------------------------------------------------------------------
// Read and validate fields
// ---------------------------------------------------------------------------
$data = [
    "firstName"       => clean_line($_POST["firstName"] ?? "", 100),
    "lastName"        => clean_line($_POST["lastName"] ?? "", 100),
    "stageName"       => clean_line($_POST["stageName"] ?? "", 100),
    "dateOfBirth"     => clean_line($_POST["dateOfBirth"] ?? "", 20),
    "email"           => clean_line($_POST["email"] ?? "", 254),
    "phone"           => clean_line($_POST["phone"] ?? "", 40),
    "location"        => clean_line($_POST["location"] ?? "", 150),
    "aboutYou"        => clean_text($_POST["aboutYou"] ?? ""),
    "instagram"       => clean_line($_POST["instagram"] ?? ""),
    "twitter"         => clean_line($_POST["twitter"] ?? ""),
    "tiktok"          => clean_line($_POST["tiktok"] ?? ""),
    "onlyfans"        => clean_line($_POST["onlyfans"] ?? ""),
    "otherPlatforms"  => clean_text($_POST["otherPlatforms"] ?? "", 1000),
    "followersCount"  => clean_line($_POST["followersCount"] ?? "", 50),
    "experienceLevel" => clean_line($_POST["experienceLevel"] ?? "", 50),
    "contentTypes"    => clean_line($_POST["contentTypes"] ?? "", 500),
    "availability"    => clean_line($_POST["availability"] ?? "", 50),
    "goalsOnPlatform" => clean_text($_POST["goalsOnPlatform"] ?? ""),
];

$missing = [];
foreach (["firstName", "lastName", "email", "phone", "dateOfBirth"] as $field) {
    if ($data[$field] === "") {
        $missing[] = $field;
    }
}
if ($missing) {
    respond(422, false, "Missing required fields: " . implode(", ", $missing));
}

if (!filter_var($data["email"], FILTER_VALIDATE_EMAIL)) {
    respond(422, false, "Please enter a valid email address");
}

$dob = DateTime::createFromFormat("!Y-m-d", $data["dateOfBirth"]);
if (!$dob || $dob->diff(new DateTime("today"))->y < 18 || $dob > new DateTime("today")) {
    respond(422, false, "You must be at least 18 years old to apply");
}

foreach (["agreeTerms", "agreeContact", "confirmAccurate"] as $field) {
    if (($_POST[$field] ?? "") !== "true") {
        respond(422, false, "Please accept all agreements before submitting");
    }
}

// ---------------------------------------------------------------------------
// Prepare storage
// ---------------------------------------------------------------------------
if (!is_dir($STORAGE_DIR) && !mkdir($STORAGE_DIR, 0750, true)) {
    respond(500, false, "Server storage is not available. Please try again later.");
}
// Block direct web access to stored applications (Apache) and directory listing
if (!file_exists($STORAGE_DIR . ".htaccess")) {
    file_put_contents($STORAGE_DIR . ".htaccess", "Require all denied\nDeny from all\n");
}
if (!file_exists($STORAGE_DIR . "index.html")) {
    file_put_contents($STORAGE_DIR . "index.html", "");
}

$applicationId = date("Ymd-His") . "-" . bin2hex(random_bytes(4));
$applicationDir = $STORAGE_DIR . $applicationId . "/";
if (!mkdir($applicationDir, 0750, true)) {
    respond(500, false, "Server storage is not available. Please try again later.");
}

// ---------------------------------------------------------------------------
// Validate and store uploads (images only; file names are generated, never
// taken from the user, so nothing executable can be uploaded)
// ---------------------------------------------------------------------------
$finfo = new finfo(FILEINFO_MIME_TYPE);

function store_upload(array $file, string $targetBase, finfo $finfo, array $allowed, int $maxSize): ?string {
    if (($file["error"] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file($file["tmp_name"])) {
        return null;
    }
    if ($file["size"] > $maxSize) {
        return null;
    }
    $mime = $finfo->file($file["tmp_name"]);
    if (!isset($allowed[$mime])) {
        return null;
    }
    $target = $targetBase . "." . $allowed[$mime];
    return move_uploaded_file($file["tmp_name"], $target) ? basename($target) : null;
}

$storedPhotos = [];
if (isset($_FILES["photos"]) && is_array($_FILES["photos"]["name"])) {
    $count = min(count($_FILES["photos"]["name"]), $MAX_PHOTOS);
    for ($i = 0; $i < $count; $i++) {
        $file = [
            "name"     => $_FILES["photos"]["name"][$i],
            "tmp_name" => $_FILES["photos"]["tmp_name"][$i],
            "error"    => $_FILES["photos"]["error"][$i],
            "size"     => $_FILES["photos"]["size"][$i],
        ];
        $stored = store_upload($file, $applicationDir . "photo-" . ($i + 1), $finfo, $ALLOWED_TYPES, $MAX_FILE_SIZE);
        if ($stored) {
            $storedPhotos[] = $stored;
        }
    }
}

$storedId = isset($_FILES["idDocument"])
    ? store_upload($_FILES["idDocument"], $applicationDir . "id-document", $finfo, $ALLOWED_TYPES, $MAX_FILE_SIZE)
    : null;

if (!$storedPhotos || !$storedId) {
    // Remove anything partially stored for this rejected submission
    array_map("unlink", glob($applicationDir . "*") ?: []);
    rmdir($applicationDir);
    respond(422, false, "Please upload at least one photo and your ID as image files (JPG, PNG, WEBP, max 10MB each)");
}

// ---------------------------------------------------------------------------
// Save application record (so nothing is lost if email delivery fails)
// ---------------------------------------------------------------------------
$record = $data + [
    "applicationId" => $applicationId,
    "submittedAt"   => date("c"),
    "photos"        => $storedPhotos,
    "idDocument"    => $storedId,
    "ip"            => $_SERVER["REMOTE_ADDR"] ?? "",
];
file_put_contents($applicationDir . "application.json", json_encode($record, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// ---------------------------------------------------------------------------
// Email notification
// ---------------------------------------------------------------------------
$na = fn($v) => $v !== "" ? $v : "N/A";

$subject = "New Model Application: " . $data["firstName"] . " " . $data["lastName"];
$message  = "New application received ({$applicationId}):\n\n";
$message .= "Name: {$data['firstName']} {$data['lastName']}\n";
$message .= "Stage Name: " . $na($data["stageName"]) . "\n";
$message .= "Email: {$data['email']}\n";
$message .= "Phone: {$data['phone']}\n";
$message .= "Location: " . $na($data["location"]) . "\n";
$message .= "Date of Birth: {$data['dateOfBirth']}\n";
$message .= "Experience Level: " . $na($data["experienceLevel"]) . "\n";
$message .= "Availability: " . $na($data["availability"]) . " hours per week\n";
$message .= "About: " . $na($data["aboutYou"]) . "\n\n";
$message .= "SOCIAL MEDIA:\n";
$message .= "Instagram: " . $na($data["instagram"]) . "\n";
$message .= "Twitter: " . $na($data["twitter"]) . "\n";
$message .= "TikTok: " . $na($data["tiktok"]) . "\n";
$message .= "OnlyFans: " . $na($data["onlyfans"]) . "\n";
$message .= "Other Platforms: " . $na($data["otherPlatforms"]) . "\n";
$message .= "Followers Count: " . $na($data["followersCount"]) . "\n\n";
$message .= "Content Types: " . $na($data["contentTypes"]) . "\n\n";
$message .= "Goals: " . $na($data["goalsOnPlatform"]) . "\n\n";
$message .= "FILES (stored on the server in applications/{$applicationId}/):\n";
$message .= "Photos: " . implode(", ", $storedPhotos) . "\n";
$message .= "ID document: {$storedId}\n";

$headers  = "From: OuraNoir Applications <{$FROM_EMAIL}>\r\n";
$headers .= "Reply-To: {$data['email']}\r\n";   // validated above, cannot contain newlines
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$mailSent = @mail($NOTIFY_EMAIL, "=?UTF-8?B?" . base64_encode($subject) . "?=", $message, $headers);
if (!$mailSent) {
    error_log("OuraNoir: application {$applicationId} saved but notification email failed");
}

respond(200, true, "Application submitted successfully!", [
    "data" => [
        "applicationId"   => $applicationId,
        "name"            => $data["firstName"] . " " . $data["lastName"],
        "applicationDate" => date("Y-m-d H:i:s"),
    ],
]);
