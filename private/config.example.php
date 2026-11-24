<?php
/**
 * Copy this file to private/config.local.php and fill in your values.
 * config.local.php is git-ignored, so your secrets never end up in the repository.
 * Alternatively set the same keys as environment variables prefixed with OURANOIR_
 * (e.g. OURANOIR_TURNSTILE_SECRET_KEY).
 */
return [
    'NOTIFY_EMAIL'         => 'you@example.com',          // TODO: where new applications/messages go
    'FROM_EMAIL'           => 'noreply@your-domain.com',  // TODO: a mailbox on your domain
    // 'STORAGE_DIR'       => '/home/youruser/ouranoir-private-storage', // recommended: outside public_html
    'TURNSTILE_SECRET_KEY' => '',                         // TODO: from Cloudflare dashboard > Turnstile
];
