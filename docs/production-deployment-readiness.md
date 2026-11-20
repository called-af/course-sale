# Production Deployment Readiness (preparation only)

This document is a **preparation checklist**. No live production changes have been made.
It covers the remaining deployment blockers after the landing/admin English UI work:

1. Production `.env`
2. Google OAuth
3. Midtrans production/staging
4. Migration reconciliation for an existing database
5. Runtime verification (queue, scheduler, storage, build)

---

## 1) Production `.env`

Start from `.env.example`. Do not copy the current local `.env`: it is still
`APP_ENV=local`, `APP_DEBUG=true`, `APP_URL=http://localhost`, `MAIL_MAILER=log`,
`QUEUE_CONNECTION=sync`, and Midtrans sandbox.

### Required production values

| Variable                                                                                                                                       | Production value / rule                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `APP_NAME`                                                                                                                                     | Site name shown in UI and emails                                                                                                            |
| `APP_ENV`                                                                                                                                      | `production`                                                                                                                                |
| `APP_KEY`                                                                                                                                      | Generate once with `php artisan key:generate`; keep it stable and secret                                                                    |
| `APP_DEBUG`                                                                                                                                    | `false`                                                                                                                                     |
| `APP_URL`                                                                                                                                      | Exact HTTPS domain, e.g. `https://example.com`                                                                                              |
| `APP_LOCALE` / `APP_FALLBACK_LOCALE`                                                                                                           | `en`                                                                                                                                        |
| `LOG_CHANNEL` / `LOG_LEVEL`                                                                                                                    | `stack` / `info` or `error`; avoid `debug` in production                                                                                    |
| `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`                                                             | Production database credentials                                                                                                             |
| `SESSION_DRIVER`                                                                                                                               | `database` (or `redis` if configured)                                                                                                       |
| `SESSION_SECURE_COOKIE`                                                                                                                        | `true` (also inferred from `APP_ENV=production`, but set it explicitly)                                                                     |
| `SESSION_SAME_SITE`                                                                                                                            | `lax` unless a cross-site flow requires otherwise                                                                                           |
| `TRUSTED_PROXIES`                                                                                                                              | Set only if behind a trusted load balancer/reverse proxy                                                                                    |
| `CACHE_STORE`                                                                                                                                  | `database` or `redis`                                                                                                                       |
| `QUEUE_CONNECTION`                                                                                                                             | `database` (or `redis`); **not** `sync`                                                                                                     |
| `FILESYSTEM_DISK`                                                                                                                              | `public` if certificates/uploads are served from `storage/app/public`                                                                       |
| `MAIL_MAILER`                                                                                                                                  | `smtp` (or the production provider), with `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` |
| `PAYMENT_GATEWAY`                                                                                                                              | `midtrans`                                                                                                                                  |
| `PAYMENT_CURRENCY`                                                                                                                             | `IDR`                                                                                                                                       |
| `PLATFORM_FEE_PERCENT`, `PAYOUT_HOLD_DAYS`, `PAYOUT_MINIMUM`, `PAYOUT_ACCOUNT_LOCK_HOURS`, `REFUND_WINDOW_DAYS`, `REFUND_MAX_PROGRESS_PERCENT` | Confirm business values; do not leave demo defaults unintentionally                                                                         |
| `SEEDER_PASSWORD`                                                                                                                              | Must not be `password` in production                                                                                                        |
| `CONTACT_EMAIL`                                                                                                                                | Real support address shown on marketing pages                                                                                               |
| `RECOMMENDATION_ENABLED`, `RECOMMENDATION_CACHE_TTL`                                                                                           | Confirm desired state                                                                                                                       |
| `NVIDIA_API_KEY`, `NVIDIA_BASE_URL`, `NVIDIA_MODEL`                                                                                            | Only if AI chat is enabled                                                                                                                  |
| `WHATSAPP_PROVIDER`, `INFOBIP_*` / `WHATSAPP_*`                                                                                                | Only if WhatsApp notifications are enabled                                                                                                  |

### Apply

```bash
# On the production server, after writing .env:
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
```

Verify with a harmless request and log inspection, e.g. `/up`, admin login, and
`php artisan about --only=environment`.

---

## 2) Google OAuth

The Google login button is currently exposed, but `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET` are missing locally. `/auth/google/redirect` reaches Google
and fails with `invalid_request`.

### Steps

1. In Google Cloud Console, create/configure an OAuth 2.0 **Web application** client.
2. Add the exact authorized redirect URI:

    ```text
    https://<your-domain>/auth/google/callback
    ```

    It must match `GOOGLE_REDIRECT_URI` byte-for-byte. Local/ staging URIs should be
    added separately if those environments are tested.

3. Set in `.env`:

    ```dotenv
    GOOGLE_CLIENT_ID=<client-id>
    GOOGLE_CLIENT_SECRET=<client-secret>
    GOOGLE_REDIRECT_URI="https://<your-domain>/auth/google/callback"
    ```

4. Clear/rebuild config cache.
5. Smoke test:
    - `/auth/google/redirect` redirects to Google without `invalid_request`.
    - New user is created and routed to role selection.
    - Existing Google user logs in.
    - Existing password user is linked by email.
    - Failure/cancel path redirects back to login safely.

Routes involved: `GET /auth/google/redirect` and `GET /auth/google/callback`.

---

## 3) Midtrans production/staging

`MidtransPaymentGateway::assertReady()` rejects a mode/key mismatch. Do not mix
sandbox keys with production mode or vice versa.

### Production mode

```dotenv
MIDTRANS_IS_PRODUCTION=true
MIDTRANS_SERVER_KEY=Mid-server-...
MIDTRANS_CLIENT_KEY=Mid-client-...
MIDTRANS_MERCHANT_ID=<merchant-id>
MIDTRANS_TIMEOUT=15
```

Leave `MIDTRANS_SNAP_BASE_URL` and `MIDTRANS_API_BASE_URL` **unset** unless traffic is
deliberately proxied. With the flag set, the app derives `https://app.midtrans.com` and
`https://api.midtrans.com` automatically.

### Sandbox / production-like staging

```dotenv
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=SB-Mid-server-...
MIDTRANS_CLIENT_KEY=SB-Mid-client-...
MIDTRANS_MERCHANT_ID=<sandbox-merchant-id>
```

### Webhook

Set the Midtrans notification URL to the public HTTPS endpoint:

```text
https://<your-domain>/payments/midtrans/webhook
```

Confirm it is not blocked by auth, CSRF, firewall, or WAF, and that signature and
`gross_amount` verification succeed. The webhook route is throttled and named
`payment.webhook.midtrans`.

### Validation

Use `docs/midtrans-e2e-validation-checklist.md` for the full scenario matrix
(checkout, expiry, settlement/capture, refunds, chargeback, payout, idempotency).
Admin payment diagnostics must show no critical issue before E2E begins.

---

## 4) Migration reconciliation (existing production DB)

**Never run the consolidated create-only migrations or `migrate:fresh --seed` against
an existing production database.** See `docs/migration-reconciliation.md` for the
full rationale.

### Safe sequence

1. Take a full backup of the database **and** `storage/`; test the restore.
2. Clone production to staging and rehearse everything there.
3. Compare the staging schema against the final schema in
   `database/migrations/2026_01_01_000001_*` through `000064_*`.
   Pay special attention to `users.google_id` (nullable unique), `users.password`
   nullable, `remember_token`, and newer feature tables/columns.
4. Apply only additive/idempotent fixes. The known reconciliation migration is safe:

    ```bash
    php artisan migrate --path=database/migrations/2026_11_18_000001_add_google_auth_columns_to_users_table.php
    ```

5. Once the schema matches, **baseline the `migrations` table** without executing the
   create-only DDL. Record the old migration list for audit first. Conceptually:

    ```php
    // Run on the verified staging clone first.
    $files = glob(database_path('migrations/2026_01_01_*.php'));
    $rows = array_map(fn ($file) => [
        'migration' => pathinfo($file, PATHINFO_FILENAME),
        'batch'     => 999, // choose the team's baseline batch
    ], $files);

    DB::table('migrations')->insertOrIgnore($rows);
    ```

    Only mark the final consolidated files whose schema is already present. Do not
    baseline files that still require a forward change.

6. Verify:

    ```bash
    php artisan migrate:status
    php artisan migrate          # should be a no-op for the baselined set
    php artisan progress:sync-materials --dry-run
    php artisan progress:sync-materials
    ```

7. Smoke test auth/Google, learning/progress, quizzes, checkout/webhook, certificates,
   resources, dashboards, and payouts. Log who/when/which DB/batch was baselined.

---

## 5) Runtime verification

Before go-live, on a production-like server:

```bash
npm run build
php artisan storage:link
php artisan queue:work --tries=3 --stop-on-failure   # run under supervisor
# Scheduler cron:
# * * * * * cd /path/to/app && php artisan schedule:run >> /dev/null 2>&1
php artisan orders:expire                            # verify manual run; schedule every ~10 min
```

Checklist:

- [ ] `public/build/manifest.json` matches the deployed assets.
- [ ] `storage:link` exists and `storage/` is writable by the web/queue user.
- [ ] Queue worker is running and failed jobs are monitored.
- [ ] Scheduler cron runs `schedule:run`.
- [ ] HTTPS, secure cookies, and trusted proxy headers are correct.
- [ ] Payment logs and application logs are free of config/schema errors.

---

## Deployment topology: Docker or native?

This app is a single Laravel 12 + Inertia/React + MySQL application. It does **not**
need a container orchestrator.

### Recommendation

- **For your own production go-live:** use a **native VPS** (Nginx + PHP-FPM +
  Supervisor + cron). It is simpler, cheaper, and easier to debug. Docker does not
  solve missing credentials, Midtrans E2E, or DB reconciliation.
- **If you sell/distribute the source code:** ship **Docker Compose as an optional
  starter**, so the buyer can run it without installing PHP/Node manually. Keep the
  native runbook too.

### Native config (recommended for go-live)

Ready-to-copy files are in `deploy/` (Nginx, Supervisor, cron and short setup notes).
No deploy shell script is included; use the standard Laravel commands in
`deploy/README.md`.

- PHP 8.2+ with `pdo_mysql`, `mbstring`, `dom`, `xml`, `xmlwriter`, `simplexml`,
  `curl`, `fileinfo`, `openssl`, `zip` (plus standard extensions).
- MySQL 8; Node 20.19+/22 LTS is only needed at build time.
- Web root: `public/`. Document root must not point to the project root.
- Release steps:

    ```bash
    composer install --no-dev --prefer-dist --optimize-autoloader
    npm ci
    npm run build
    php artisan storage:link
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    ```

- `queue:work` runs under Supervisor. `schedule:run` runs from cron every minute.
- `storage/` and `bootstrap/cache/` must be writable by the web/queue user.
- Set `FILESYSTEM_DISK=public` if certificates/uploads are served from `/storage`.

### Docker config (optional, for handoff)

- Services: `app` (PHP-FPM), `nginx`, `queue` (same image, different command),
  `scheduler` (cron), plus MySQL or an external managed DB.
- Use a multi-stage build: Node stage produces `public/build`; runtime image installs
  Composer prod dependencies only.
- Do **not** run `php artisan migrate` on every container start. Migration/baseline is
  a deliberate release step.
- Mount `.env` as `env_file`/secret; persist `storage/` with a volume.
- Put Caddy/Traefik or a host reverse proxy in front for HTTPS.

---

## Current blocked items (no live action taken)

- [ ] Production `.env` values and server access
- [ ] Google OAuth client ID/secret and exact redirect URI
- [ ] Midtrans production keys/merchant ID + public HTTPS webhook configured
- [ ] Existing production DB migration baseline after staging rehearsal
- [ ] Staging E2E and production-like runtime checks

Pause further deployment work until these inputs/access are provided.
