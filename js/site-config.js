/*
 * Public, browser-side configuration for OuraNoir.
 * Only PUBLIC identifiers belong here (they are visible to every visitor).
 * Secrets (Turnstile secret key, email settings) live server-side in private/config.php.
 */
window.OURANOIR_CONFIG = {
    // Google Analytics 4 measurement ID, e.g. "G-ABC123XYZ9".
    // TODO: replace the placeholder. Analytics stays off until a real ID is set
    // AND the visitor accepts analytics cookies.
    gaMeasurementId: "G-XXXXXXXXXX",

    // Cloudflare Turnstile SITE key (public). Leave empty to disable the widget.
    // TODO: create a widget at dash.cloudflare.com > Turnstile, put the site key here
    // and the secret key in private/config.local.php (TURNSTILE_SECRET_KEY).
    turnstileSiteKey: "",

    // Public contact email shown on the application success screen.
    // Set CONTACT_EMAIL in tools/build_pages.py; the build copies it here.
    contactEmail: "hello@example.com"
};
