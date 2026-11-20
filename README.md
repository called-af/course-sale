# Course Sale Platform

A production-capable course selling and learning platform built with **Laravel 12**,
**Inertia.js 2**, **React 19**, and **TypeScript**. It includes a public landing page,
student and instructor areas, a full admin panel, Midtrans payments, instructor
payouts, certificates, reviews/comments, AI chat, and WhatsApp notifications.

> Source-code product. See [`LICENSE`](LICENSE) for proprietary licensing terms.
> For a working setup, start with [`docs/QUICKSTART.md`](docs/QUICKSTART.md).

---

## Highlights

### Public

- Landing page with editable sections: hero, about, benefits, categories, courses,
  instructors, testimonials, FAQ, trust bar, CTA, footer and legal links.
- Trust-bar payment logos are managed from the admin panel (PNG uploads only).
- Course catalog, course detail, certificate verification, terms and privacy pages.
- Login, registration, email verification, forgot/reset password, Google OAuth.

### Student

- Enroll in free or paid courses.
- Midtrans checkout with webhook-driven enrollment.
- Learning player with text, video, file, presentation and quiz content blocks.
- Progress tracking, resume, course resources and downloadable certificate.
- Reviews, comments and refund-policy notice.

### Instructor

- Course, module, material and quiz management.
- Quiz grading queue and student list export.
- Earnings dashboard, payout bank account, payout ledger and CSV export.
- WhatsApp notification settings and message preview.

### Admin

- Dashboard, user/course/category/tag management, order and refund operations.
- Landing-page editor, appearance/branding/logo settings, SEO settings.
- Midtrans payment settings and diagnostics, platform fee and payout operations.
- AI providers/credentials/models, WhatsApp providers/templates/webhooks.
- Certificate designer with drag-and-position text and uploadable background.

### Platform

- Native Laravel recommendation engine (no external Python service required).
- AI assistant with read-only, role-aware course tools.
- Encrypted AI/WhatsApp credentials and payout bank accounts.
- Webhook signature verification, idempotency and payout account lock.
- 268 automated tests covering critical flows.

---

## Tech stack

| Layer               | Technology                                                        |
| ------------------- | ----------------------------------------------------------------- |
| Backend             | PHP 8.2+, Laravel 12                                              |
| Frontend            | React 19, Inertia.js 2, TypeScript 5, Tailwind CSS 4, Vite 7      |
| Animation           | Motion                                                            |
| Database            | MySQL 8 / MariaDB 10.6+                                           |
| Payments            | Midtrans Snap (sandbox and production)                            |
| PDF                 | dompdf                                                            |
| Queue/cache/session | Database (Redis optional)                                         |
| Deploy              | Native VPS (Nginx + PHP-FPM + Supervisor + cron); Docker optional |

---

## Quick start

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
npm install
npm run build
php artisan serve
```

Open `http://localhost:8000`.

See [`docs/QUICKSTART.md`](docs/QUICKSTART.md) for production `.env` values,
default accounts, rebranding steps, and Midtrans/Google configuration.

---

## Common commands

```bash
php artisan test          # full test suite
./vendor/bin/pint --dirty # format changed PHP files
npx tsc --noEmit         # TypeScript check
npx eslint .             # lint frontend
npm run build            # production assets
```

Scheduled and queued work:

```bash
php artisan queue:work
php artisan schedule:run
php artisan orders:expire
php artisan progress:sync-materials
php artisan system:prune-data
```

---

## Deployment

Native VPS configuration is in [`deploy/`](deploy):

- `nginx.conf`
- `supervisor.conf`
- `cron`
- short setup notes in [`deploy/README.md`](deploy/README.md)

Deployment guide and go-live checklist:
[`docs/production-deployment-readiness.md`](docs/production-deployment-readiness.md).

For an existing database, **do not** run `migrate:fresh` or the consolidated
create-only migrations. Follow
[`docs/migration-reconciliation.md`](docs/migration-reconciliation.md).

Midtrans end-to-end validation scenarios are documented in
[`docs/midtrans-e2e-validation-checklist.md`](docs/midtrans-e2e-validation-checklist.md).

---

## Configuration notes

- `.env` is gitignored. Only `.env.example` is committed.
- `SEEDER_PASSWORD` in `.env.example` is for local demos only; override it.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are required before exposing Google login.
- Midtrans production requires `MIDTRANS_IS_PRODUCTION=true`, production keys and
  the webhook `https://your-domain/payments/midtrans/webhook`. Never mix sandbox
  keys with production mode.
- Set `FILESYSTEM_DISK=public` and run `php artisan storage:link` when serving
  certificates and uploads from `/storage`.

---

## Rebranding

The default product name is **KursusIO**. To rebrand:

1. Set `APP_NAME` and `VITE_APP_NAME` in `.env`.
2. Update the admin identity/branding settings (logo, colors, app name).
3. Update the fallback names in `resources/js/app.tsx`, `resources/js/ssr.tsx`
   and `resources/js/hooks/useBranding.ts` if the admin UI is not used.
4. Replace the landing content from **Settings → Landing**.
5. Replace legal text in `app/Http/Controllers/Legal/LegalController.php`.
6. Remove the original git remote before delivering a copy to a customer.

---

## Third-party assets

Payment method logos in `public/images/payment-methods/` are PNG assets for
Midtrans, Visa, Mastercard and e-wallet brands. Those trademarks remain the
property of their respective owners and may be subject to separate brand
guidelines. Confirm permitted use before commercial distribution.

---

## Documentation

- [`docs/QUICKSTART.md`](docs/QUICKSTART.md) — installation and first run
- [`docs/production-deployment-readiness.md`](docs/production-deployment-readiness.md) — production checklist
- [`docs/migration-reconciliation.md`](docs/migration-reconciliation.md) — existing DB migration baseline
- [`docs/midtrans-e2e-validation-checklist.md`](docs/midtrans-e2e-validation-checklist.md) — payment E2E matrix
- [`docs/README.id.md`](docs/README.id.md) — legacy Indonesian documentation

Design/PRD documents in `docs/` are retained as historical reference.

---

## License

Proprietary. See [`LICENSE`](LICENSE).
