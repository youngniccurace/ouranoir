# ouranoir

Website for **OuraNoir**, an OnlyFans management agency.

## Project structure

| Path | What it is |
| --- | --- |
| `*.html`, `css/`, `js/`, `lib/`, `img/` | The main static website (Bootstrap 5 + jQuery). |
| `fan-form-flow/` | **Source code** of the model application form (React + Vite + Tailwind + shadcn/ui, originally built in Lovable). |
| `apply/` | **Built** application form, served at `/apply/`. Generated from `fan-form-flow/` - don't edit by hand. |
| `apply/process_form.php` | Backend that receives applications (copied from `fan-form-flow/public/`). |
| `applications/` | Created on the server when applications arrive (details, photos, ID). Git-ignored, private. |

The "Apply Now" buttons and the "Join Us" menu link on every page open `apply/`.

## Editing the application form

```bash
cd fan-form-flow
npm install
npm run dev      # local dev server on http://localhost:8080 (submitting needs PHP, see below)
npm run build    # rebuilds ../apply/
```

Commit both `fan-form-flow/` and the rebuilt `apply/` folder.

To test the full flow including submissions locally (needs PHP 8):

```bash
php -S 127.0.0.1:8000   # from the repo root, then open http://127.0.0.1:8000/apply/
```

## Deploying

The site needs a host that runs **PHP** (e.g. cPanel/shared hosting with Apache) for the form to work.
Upload everything except `fan-form-flow/` and `node_modules/`.

Settings are at the top of `fan-form-flow/public/process_form.php`:

- `$NOTIFY_EMAIL` - who gets notified about new applications.
- `$FROM_EMAIL` - must be a mailbox on your hosting domain or emails may be rejected as spam.
- `$STORAGE_DIR` - where applications are stored. Moving it outside the public web root is safest,
  since it holds ID documents. Inside the web root it's protected by an auto-generated `.htaccess` (Apache only).

Every application is saved to `applications/<id>/` even if the notification email fails.
