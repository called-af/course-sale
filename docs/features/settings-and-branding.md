# Settings, Branding, SEO and Payment Configuration

> Part of the [Feature Documentation](../FEATURES.md) index.

## Overview

Admin settings control the app identity, palette, logo, SEO metadata, payment
gateway and operational toggles. Landing content has its own editor; see
[Landing page](landing-page.md). Sensitive legacy AI and WhatsApp credentials
require current-password verification.

## Roles

- **Admin only** — all settings pages require the `manage-settings` gate.
- Other roles receive 403 or a redirect.

## Flow

### 1. General and identity

1. Admin opens `/admin/settings/general`.
2. Admin sets the app name and contact email under **Identity**.
3. Admin chooses a palette under **Appearance**.
4. Admin uploads or removes the app logo.
5. Old logo files are deleted when replaced or removed.

Identity validation: app name maximum 60 characters; contact email must be a
valid address up to 120 characters. Logo accepts `jpg`, `jpeg`, `png`, `webp`
and `svg`, up to 2048 KB.

### 2. SEO

1. Admin opens `/admin/settings/seo` and submits `POST /admin/settings/seo`.
2. Admin sets meta title, description, keywords, canonical URL, robots, Open
   Graph fields, Twitter card fields and verification IDs.
3. An OG image can be uploaded up to 4096 KB.
4. Google Analytics IDs accept `G-`, `UA-` and `AW-` formats; GTM accepts `GTM-`.
5. Replacing or removing the OG image deletes the old file.

### 3. Payment and payout rules

1. Admin opens `/admin/settings/payment`.
2. Gateway is fixed to `midtrans` and currency to `IDR`.
3. Admin sets the platform fee, payout hold days, minimum payout and account lock hours.
4. Saving activates Midtrans and seeds the default payment methods: Credit Card,
   QRIS, Virtual Account and GoPay.

Ranges: platform fee 0–100%, hold days 0–90, minimum payout ≥ 0, account lock
0–168 hours.

### 4. Feature toggles

Admin can toggle:

- **AI** — cannot be enabled until base URL, model and API key are complete.
- **Recommendations** — controls the native recommendation engine.
- **WhatsApp** — controls outbound notifications.

Legacy AI/WhatsApp credential changes require the current password. Changing an
AI base URL requires re-entering the API key.

### 5. Landing settings

Admin opens `/admin/settings/landing` to edit individual sections. This is
documented separately in [Landing page](landing-page.md).

## Rules and guards

- `Gate::define('manage-settings', ...)` allows only admin.
- AI cannot be enabled while incomplete:
  `Base URL, model, and API key must be complete before AI is enabled.`
- Legacy AI base URLs must be HTTPS and must not point to private or reserved
  hosts, unless local endpoints are explicitly allowed.
- Legacy AI provider must be `nvidia` or `openai`; legacy WhatsApp provider must
  be `infobip` or `meta`.
- Changing a base URL or saving without an existing key requires a new key.
- Wrong current password returns 422 with `errors.current_password`.

## Where to find it

- **UI:** `resources/js/pages/admin/settings/General.tsx`, `Seo.tsx`,
  `resources/js/pages/admin/landing/Settings.tsx`.
- **Routes:** `GET /admin/settings/general`, `GET /admin/settings/seo`,
  `POST /admin/settings/seo`, `PUT /admin/settings/appearance`,
  `PUT /admin/settings/identity`, `POST/DELETE /admin/settings/logo`,
  `GET/PUT /admin/settings/payment`, plus AI/recommendation/WhatsApp toggle routes.

## Key implementation files

- `app/Http/Controllers/Admin/GeneralSettingsController.php`
- `app/Http/Controllers/Admin/SeoSettingsController.php`
- `app/Services/Payment/PaymentSettings.php`
- `app/Services/AiSettings.php`
- `app/Providers/AppServiceProvider.php`
- `app/Models/AppearanceSetting.php`

## Edge cases

- Admin branding overrides the fallback app name in `app.tsx`, `ssr.tsx` and
  `useBranding.ts`.
- Payment settings changes affect new and existing payout calculations.
- Disable AI or WhatsApp when credentials are missing to avoid 503 responses in
  user-facing features.
- Replaced uploads are deleted from the public disk.

## Related guides

- [Landing page](landing-page.md)
- [AI integrations](ai-integrations.md)
- [WhatsApp notifications](whatsapp-notifications.md)
- [Instructor payouts](instructor-payouts.md)
