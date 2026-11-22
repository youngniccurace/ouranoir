<?php
/**
 * OuraNoir - enquiry handler for the audience pages:
 *   agencies.html (agency), careers.html (careers), partnerships.html (partnership), investors.html (investor)
 * Each form type has a schema below. Everything is validated server-side, stored in
 * private storage and emailed. Settings/secrets: private/config.php.
 */
declare(strict_types=1);
require __DIR__ . '/private/lib.php';

$EMAIL = ['type' => 'email', 'required' => true, 'label' => 'Email'];
$NAME = ['type' => 'text', 'required' => true, 'min' => 2, 'max' => 100, 'label' => 'Name'];
$URL = ['type' => 'url', 'max' => 300, 'label' => 'Website'];
$MESSAGE = static fn (bool $req, int $min = 0) => ['type' => 'textarea', 'required' => $req, 'min' => $min, 'max' => 3000, 'label' => 'Message'];

const FORMS_SUBJECT = [
    'agency'      => 'Agency enquiry',
    'careers'     => 'Job application',
    'partnership' => 'Partnership proposal',
    'investor'    => 'Investor enquiry',
];

$SCHEMAS = [
    'agency' => [
        'name' => $NAME, 'email' => $EMAIL,
        'company' => ['type' => 'text', 'required' => true, 'max' => 150, 'label' => 'Agency name'],
        'company_url' => $URL,
        'roster_size' => ['type' => 'choice', 'required' => true, 'options' => ['1-5', '6-15', '16-50', '50+'], 'label' => 'Creators managed'],
        'timeline' => ['type' => 'choice', 'options' => ['As soon as possible', 'Within a month', 'In 1-3 months', 'Just exploring'], 'label' => 'Timeline'],
        'services' => ['type' => 'multi', 'options' => ['Chatting team', 'Traffic & promotion', 'Back-office & operations', 'Strategy & consulting', 'Creator onboarding', 'White-label support'], 'label' => 'Services'],
        'message' => $MESSAGE(false),
    ],
    'careers' => [
        'name' => $NAME, 'email' => $EMAIL,
        'role' => ['type' => 'choice', 'required' => true, 'options' => ['Chatter', 'Traffic Specialist', 'Social Media Manager', 'Content Editor & Designer', 'Account Manager', 'Open Application'], 'label' => 'Role'],
        'experience' => ['type' => 'choice', 'required' => true, 'options' => ['None yet - eager to learn', 'Less than 1 year', '1-2 years', '3+ years'], 'label' => 'Experience'],
        'country' => ['type' => 'text', 'required' => true, 'max' => 80, 'label' => 'Country'],
        'hours' => ['type' => 'choice', 'required' => true, 'options' => ['Up to 20', '20-30', '30-40', '40+'], 'label' => 'Hours per week'],
        'languages' => ['type' => 'text', 'required' => true, 'max' => 200, 'label' => 'Languages'],
        'portfolio' => ['type' => 'url', 'max' => 300, 'label' => 'Portfolio link'],
        'message' => $MESSAGE(true, 30),
        'adult' => ['type' => 'confirm', 'required' => true, 'label' => '18+ confirmed', 'error' => 'You must be 18 or over to apply.'],
    ],
    'partnership' => [
        'name' => $NAME, 'email' => $EMAIL,
        'company' => ['type' => 'text', 'required' => true, 'max' => 150, 'label' => 'Company / brand'],
        'company_url' => $URL,
        'partnership_type' => ['type' => 'choice', 'required' => true, 'options' => ['Brand / sponsorship', 'Platform or tool', 'Traffic source / promoter', 'Studio / photographer', 'Agency referral or white-label', 'Other'], 'label' => 'Partnership type'],
        'message' => $MESSAGE(true, 20),
    ],
    'investor' => [
        'name' => $NAME, 'email' => $EMAIL,
        'company' => ['type' => 'text', 'max' => 150, 'label' => 'Organisation'],
        'investor_type' => ['type' => 'choice', 'required' => true, 'options' => ['Angel investor', 'Venture capital', 'Family office', 'Strategic / industry partner', 'Other'], 'label' => 'Investor type'],
        'ticket_size' => ['type' => 'choice', 'options' => ['Prefer not to say', 'Under $25k', '$25k-$100k', '$100k-$500k', '$500k+'], 'label' => 'Investment range'],
        'message' => $MESSAGE(true, 20),
    ],
];

require_post();
$type = (string) ($_POST['form_type'] ?? '');
if (!isset($SCHEMAS[$type])) {
    respond(400, false, 'Unknown form.');
}
check_spam('enquiry-' . $type);

// --- Validate against the schema ---------------------------------------------
$data = [];
$errors = [];
foreach ($SCHEMAS[$type] as $field => $rule) {
    $required = !empty($rule['required']);
    $label = strtolower($rule['label']);
    switch ($rule['type']) {
        case 'email':
            $value = clean_line($_POST[$field] ?? '', 254);
            if (!is_valid_email($value)) {
                $errors[$field] = $value === '' ? 'Please enter your email address.' : 'Please enter a valid email address, like name@example.com.';
            }
            break;
        case 'url':
            $value = clean_line($_POST[$field] ?? '', $rule['max']);
            if ($value !== '' && (!filter_var($value, FILTER_VALIDATE_URL) || !preg_match('#^https?://#i', $value))) {
                $errors[$field] = 'Please enter a full link starting with https://';
            }
            break;
        case 'choice':
            $value = clean_line($_POST[$field] ?? '', 100);
            if ($value === '' && $required) {
                $errors[$field] = "Please choose {$label}.";
            } elseif ($value !== '' && !in_array($value, $rule['options'], true)) {
                $errors[$field] = 'Please choose an option from the list.';
            }
            break;
        case 'multi':
            $raw = $_POST[$field] ?? [];
            $value = array_values(array_intersect(is_array($raw) ? array_map('strval', $raw) : [], $rule['options']));
            break;
        case 'confirm':
            $value = ($_POST[$field] ?? '') === 'yes';
            if ($required && !$value) {
                $errors[$field] = $rule['error'] ?? 'Please confirm this.';
            }
            break;
        case 'textarea':
            $value = clean_text($_POST[$field] ?? '', $rule['max']);
            if ($value === '' && $required) {
                $errors[$field] = 'Please tell us a little more.';
            } elseif ($value !== '' && mb_strlen($value) < ($rule['min'] ?? 0)) {
                $errors[$field] = "Please write at least {$rule['min']} characters.";
            }
            break;
        default: // text
            $value = clean_line($_POST[$field] ?? '', $rule['max'] ?? 200);
            if ($value === '' && $required) {
                $errors[$field] = "Please enter your {$label}.";
            } elseif ($value !== '' && mb_strlen($value) < ($rule['min'] ?? 0)) {
                $errors[$field] = ucfirst($label) . " must be at least {$rule['min']} characters.";
            }
    }
    $data[$field] = $value;
}
if (($_POST['privacy'] ?? '') !== 'yes') {
    $errors['privacy'] = "Please confirm you've read the Privacy Policy.";
}
if ($errors) {
    respond(422, false, 'Please correct the highlighted fields.', $errors);
}

// --- Store, notify, respond ------------------------------------------------------
$id = date('Ymd-His') . '-' . bin2hex(random_bytes(4));
$saved = @file_put_contents(storage_dir('enquiries/' . $type) . $id . '.json', json_encode(
    ['id' => $id, 'type' => $type, 'receivedAt' => date('c'), 'ip' => client_ip()] + $data,
    JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
));

$lines = [];
foreach ($SCHEMAS[$type] as $field => $rule) {
    $v = $data[$field];
    $v = is_array($v) ? ($v ? implode(', ', $v) : 'N/A') : (is_bool($v) ? ($v ? 'Yes' : 'No') : ($v !== '' ? $v : 'N/A'));
    $lines[] = $rule['label'] . ': ' . $v;
}
$mailed = send_notification(
    FORMS_SUBJECT[$type] . ': ' . $data['name'] . (isset($data['company']) && $data['company'] !== '' ? " ({$data['company']})" : ''),
    'New ' . strtolower(FORMS_SUBJECT[$type]) . " from the OuraNoir website ({$id}):\n\n" . implode("\n", $lines) . "\n",
    $data['email']
);

if (!$saved && !$mailed) {
    respond(500, false, 'Sorry, your message could not be sent. Please try again later or email us directly.');
}
record_submission('enquiry-' . $type);
$first = explode(' ', $data['name'])[0];
respond(200, true, $type === 'careers'
    ? "Thanks, {$first}! Your application has been received. We'll be in touch within 5 business days."
    : "Thanks, {$first}! Your message has been received. We'll reply within 2–3 business days.");
