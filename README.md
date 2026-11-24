# ouranoir

Website for **OuraNoir**, an OnlyFans management agency: a static, multi-page site plus a
React application form, with small PHP handlers for the forms.

## Project structure

| Path | What it is |
| --- | --- |
| `index.html` (hub), `creators.html`, `agencies.html`, `careers.html`, `partnerships.html`, `investors.html`, `about.html`, `service.html`, `contact.html`, `privacy.html`, `terms.html`, `404.html` | **Generated** pages - edit `tools/content/*.html` + `tools/build_pages.py`, then rebuild. |
| `enquiry.php` | Form handler for the Agencies, Careers, Partnerships and Investors forms (one schema per form). |
| `img/stock/` | **Temporary** Unsplash photos (`CREDITS.md`). Replace with your own photos using the same file names; the list and alt text live in `tools/stock-photos.txt`. |
| `js/theme.js` | Dark mode (saved choice or device setting) and colour-palette previews. |
| `tools/content/` | The body content of each page. |
| `tools/build_pages.py` | Wraps content in the shared head (meta, Open Graph/Twitter, favicons), navbar and footer; writes `sitemap.xml`, `robots.txt`, `site.webmanifest`. **Site settings (domain, email, social links) are at the top.** |
| `tools/build-assets.mjs` | Self-hosted fonts, SVG icon sprite, trimmed Bootstrap, bundled `css/site.min.css`, minified `js/site.min.js` / `js/forms.min.js`. |
| `tools/make-images.mjs` | One-off generator for favicons and the 1200×630 social image. |
| `css/style.css`, `css/consent.css`, `css/fonts.css`, `js/*.js` | Source styles/scripts (bundled into the `.min` files by the build). |
| `js/site-config.js` | **Public** IDs: Google Analytics measurement ID, Cloudflare Turnstile site key, contact email. |
| `private/` | Server-side only (blocked from the web): `config.php` loader, `lib.php` (validation + spam protection), storage. |
| `contact.php` | Contact form handler. |
| `fan-form-flow/` | Source of the React application form (Vite + Tailwind). `npm run build` outputs to `apply/`. |
| `apply/` | **Built** application form + `process_form.php` (copied from `fan-form-flow/public/`). |
| `.htaccess`, `.user.ini` | Apache config: HTTPS redirect, security headers/CSP, 404 page, caching, compression, blocked folders; PHP upload limits. |
| `deploy/nginx.conf.example` | Same rules for nginx. |

## Before launch - fill in

1. `tools/build_pages.py`: `SITE_URL`, `BUSINESS_NAME`, `CONTACT_EMAIL`, `SOCIAL` links -> rebuild.
2. `fan-form-flow/index.html`: replace `https://www.example.com` (canonical / social tags) -> rebuild the form.
3. `js/site-config.js`: `gaMeasurementId` (GA4) and `turnstileSiteKey` (Cloudflare Turnstile).
4. Server secrets - copy `private/config.example.php` to `private/config.local.php` (git-ignored) **or** set
   environment variables `OURANOIR_NOTIFY_EMAIL`, `OURANOIR_FROM_EMAIL`, `OURANOIR_TURNSTILE_SECRET_KEY`,
   optionally `OURANOIR_STORAGE_DIR` (recommended: a folder outside the public web root).
5. Replace the placeholder legal text in `tools/content/privacy.html` and `tools/content/terms.html`
   (everything in `[square brackets]`) with lawyer-reviewed copy, and the commission answer in the homepage FAQ.
6. Install an SSL certificate (e.g. Let's Encrypt in cPanel) - `.htaccess` then forces HTTPS.

## Build

```bash
cd tools && npm install && npm run build        # pages + CSS/JS/fonts/icons
cd fan-form-flow && npm install && npm run build # application form -> apply/
```

Commit the generated files - the server just serves them, nothing is built in production.

## Run locally (mirrors .htaccess: 404s, blocked folders, CSP, gzip)

```bash
cd tools && npm run serve    # http://127.0.0.1:8000 (needs PHP 8)
```

## Deploy

Upload everything **except** `fan-form-flow/`, `tools/`, `scss/`, `deploy/` and any `node_modules/`
(they are also blocked by `.htaccess` if uploaded by mistake). The host needs PHP 8 with `fileinfo`.

## Dark mode and colour palettes

- Visitors can switch light/dark with the moon/sun button; otherwise the device setting is used.
- The live palette is **B, "Noir, Gold & Azure"** (`DEFAULT_PALETTE` in `js/theme.js`, also set on `<html>` by the build).
- Other prototypes can be previewed on any page with `?palette=gold`, `?palette=blue`,
  `?palette=pink` or `?palette=spectrum` (remembered for that browser tab only).
  To adopt one permanently, change `DEFAULT_PALETTE` in `js/theme.js`, then run the build.
  The palette colours are the `[data-palette=...]` blocks in `css/style.css`.

## Logo

The "Aura Ring" logo (gold halo + editorial N + azure glint, with the Playfair "Oura Noir" wordmark) is
generated from the brand fonts by `tools/make-logo.py`, so it is pure vector and identical everywhere.

- Site: `img/logo.svg` sprite (`<use href="img/logo.svg#logo-lockup">`); colours follow light/dark mode via CSS variables.
- Downloads for social media / documents: `img/brand/` (light & dark logo, symbol, 1024px profile pictures).
- Favicons and the social preview image are rendered from these files by `tools/make-images.mjs`.
- To regenerate (e.g. try `WORDMARK = "script"` or `"caps"`):

```bash
pip install fonttools brotli uharfbuzz
python3 tools/make-logo.py && cd tools && npm run images && npm run build
```

Usage rules (clear space, minimum size, don'ts) are on `brand.html`.

## Replacing the stock photos

Save your photo over the matching file in `img/stock/` (keep the name and both sizes, e.g.
`aud-creators-480.webp` and `aud-creators-960.webp`), and update its alt text in `tools/stock-photos.txt`.

## Third-party services (easy to swap)

| Purpose | Chosen | Where to change |
| --- | --- | --- |
| Analytics (only after consent) | Google Analytics 4 | `js/analytics.js` (`load()`), ID in `js/site-config.js`, CSP in `.htaccess` |
| Spam challenge | Cloudflare Turnstile (privacy-friendly, usually invisible) | site key `js/site-config.js`, secret `private/config.local.php`, check in `private/lib.php` |
| Consent banner | Built-in (`js/consent.js`), no third party | `js/consent.js` / `css/consent.css` |
