# Quickstart

This guide gets the project running locally and outlines what must be configured
before selling or delivering a copy.

---

## 1) Requirements

- PHP 8.2+ with `pdo_mysql`, `mbstring`, `dom`, `xml`, `xmlwriter`, `simplexml`, `curl`, `fileinfo`, `openssl`, `zip`
- Composer 2
- MySQL 8 or MariaDB 10.6+
- Node 20.19+ / 22 LTS
- Nginx + PHP-FPM + Supervisor + cron for native VPS deployment

Docker is not required. A native VPS setup is provided in [`deploy/`](../deploy).

---

## 2) Local installation

```bash
composer install
cp .env.example .env
php artisan key:generate
```

Configure `DB_*` in `.env`, then:

```bash
php artisan migrate:fresh --seed
npm install
npm run build
php artisan serve
```

Open `http://localhost:8000`.

### Demo accounts

Seeding creates these local accounts. The password comes from `SEEDER_PASSWORD`
(default: `password`).

| Role       | Email                 |
| ---------- | --------------------- |
| Admin      | `admin@example.com`   |
| Instructor | `budi@example.com`    |
| Instructor | `rina@example.com`    |
| Instructor | `dika@example.com`    |
| Student    | `student@example.com` |

Never ship a customer copy with these passwords. In production, set a unique
`SEEDER_PASSWORD` or skip demo seeding entirely.

---

## 3) Essential `.env` values

```dotenv
APP_NAME="Your Course Platform"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com
APP_LOCALE=en
APP_FALLBACK_LOCALE=en

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=course_sale
DB_USERNAME=course_sale
DB_PASSWORD=change-me

SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
QUEUE_CONNECTION=database
CACHE_STORE=database
FILESYSTEM_DISK=public

MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=change-me
MAIL_PASSWORD=change-me
MAIL_FROM_ADDRESS="hello@your-domain.com"

PAYMENT_GATEWAY=midtrans
PAYMENT_CURRENCY=IDR
```

Full reference: [`production-deployment-readiness.md`](production-deployment-readiness.md).

---

## 4) Rebranding

1. Set `APP_NAME` and `VITE_APP_NAME`.
2. Admin → **Settings → General/Identity/Appearance**: upload logo, choose palette, set app name.
3. Admin → **Settings → Landing**: replace every section with the customer's content.
4. Admin → **Settings → SEO**: set meta title, description and OG image.
5. Edit `app/Http/Controllers/Legal/LegalController.php` for terms and privacy.
6. Replace fallback names in these files if admin branding is not used:
    - `resources/js/app.tsx`
    - `resources/js/ssr.tsx`
    - `resources/js/hooks/useBranding.ts`

---

## 5) Google OAuth

```dotenv
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI="https://your-domain.com/auth/google/callback"
```

In Google Cloud Console, add the exact redirect URI above. If credentials are
missing, hide the Google login button or complete this setup before go-live.

---

## 6) Midtrans

Sandbox:

```dotenv
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=SB-Mid-server-...
MIDTRANS_CLIENT_KEY=SB-Mid-client-...
MIDTRANS_MERCHANT_ID=...
```

Production:

```dotenv
MIDTRANS_IS_PRODUCTION=true
MIDTRANS_SERVER_KEY=Mid-server-...
MIDTRANS_CLIENT_KEY=Mid-client-...
MIDTRANS_MERCHANT_ID=...
```

Leave `MIDTRANS_SNAP_BASE_URL` and `MIDTRANS_API_BASE_URL` unset unless you
deliberately proxy requests. Set the Midtrans notification URL to:

```text
https://your-domain.com/payments/midtrans/webhook
```

Run the scenarios in [`midtrans-e2e-validation-checklist.md`](midtrans-e2e-validation-checklist.md)
before taking real payments.

---

## 7) Deployment

Use the native VPS config in [`deploy/`](../deploy) and the checklist in
[`production-deployment-readiness.md`](production-deployment-readiness.md).

Key commands:

```bash
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan storage:link
php artisan migrate --force     # fresh DB / after reconciliation only
php artisan optimize
```

Run `queue:work` under Supervisor and `schedule:run` from cron. Certificate
regeneration, pruning and progress reconciliation depend on these running.
Never use `QUEUE_CONNECTION=sync` in production.

For an existing database, follow [`migration-reconciliation.md`](migration-reconciliation.md)
instead of running create-only migrations.

---

## 8) Handoff checklist for a source-code sale

- [ ] Confirm `LICENSE` shows Working String and workingstring@gmail.com.
- [ ] Replace demo account emails and the seed password.
- [ ] Remove the original git remote: `git remote remove origin`.
- [ ] Remove local `.env` from the delivered folder (only `.env.example` should remain).
- [ ] Confirm payment logos are allowed for the buyer's use case.
- [ ] Deliver this README, `LICENSE`, `deploy/` and the docs folder together.
- [ ] State clearly what support/updates are included in the sale.
