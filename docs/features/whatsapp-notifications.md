# WhatsApp Notifications and Webhooks

> Part of the [Feature Documentation](../FEATURES.md) index.

## Overview

WhatsApp is used for enrollment and payout notifications, plus provider-driven
status and inbound messages. Admin manages providers and templates; instructors
and students manage their own notification numbers. Credentials are encrypted
and webhook signatures are verified by the provider adapter.

## Roles

- **Admin** — manages providers, templates, global toggle and test sends.
- **Instructor** — sets WhatsApp number and payout notification preferences;
  receives payout paid messages.
- **Student** — sets WhatsApp number; can receive enrollment notifications.
- **Provider** — sends webhooks for delivery status and inbound messages.
- **Queue worker** — sends queued enrollment and payout notifications.

## Flow

### 1. Admin configures providers

1. Admin opens `/admin/integrations/whatsapp`.
2. Admin creates a provider with driver, name, base URL, credentials and config.
3. Admin sets a default provider and enables/disables providers.
4. Admin can save templates, delete templates, test a provider and send a test message.
5. Admin can import legacy settings and toggle global WhatsApp notifications.

Supported drivers: `meta`, `infobip`, `fonnte` and `custom`.

### 2. Instructor and student settings

1. Instructor opens `/instructor/settings` and saves a WhatsApp number plus
   payout notification preferences.
2. Student opens `/student/settings` and saves a WhatsApp number.
3. The number is validated with the Indonesian number rules; `08...`, `+62...`
   and formatted variants are accepted.
4. Test notification creates a `WhatsAppMessage` with status `queued`, then a UUID
   idempotency key is used to send it.

### 3. Enrollment notification

1. A free enrollment or paid order completion triggers the service.
2. The platform checks that the instructor has notifications enabled and a valid number.
3. `SendWhatsAppEnrollmentNotificationJob` is queued.
4. The job sends text or a template through the configured provider.
5. Failures are logged and do not fail the enrollment.

### 4. Payout notification

1. Admin marks one payout paid or batch-pays an instructor.
2. `SendPayoutPaidNotificationJob` is queued.
3. The job sends the payout message through the provider.

### 5. Webhooks

1. `GET /webhooks/whatsapp/{provider}` handles Meta's verification challenge;
   other providers return 405.
2. `POST /webhooks/whatsapp/{provider}` is throttled to 120 requests per minute.
3. The provider must be enabled.
4. The adapter verifies the signature.
5. The platform stores contact, conversation, message and status updates in a
   transaction.
6. Provider message IDs deduplicate repeated webhooks.

Status mapping: `sent`, `accepted` and `pending_enroute` → `sent`; `delivered` →
`delivered`; `read` → `read`; `failed`, `undeliverable` and `rejected` → `failed`;
`received` → `received`.

## Rules and guards

- Credentials are encrypted.
- Capability matrix:
  - Fonnte has no template support.
  - Custom supports text, document and webhook only.
- Fallback happens on retryable failures when an idempotency key is available.
- Configuration errors and unsupported capabilities may skip a provider before sending.
- Invalid test number returns `Invalid WhatsApp number.`
- Webhook signature failures are rejected.
- Invalid numbers prevent enabling notifications when the number is required.

## Where to find it

- **Admin UI:** `resources/js/pages/admin/integrations/WhatsApp.tsx`.
- **Instructor UI:** `instructor/settings/General.tsx`.
- **Student UI:** `student/settings`.
- **Routes:** `/admin/integrations/whatsapp...`,
  `PUT /instructor/settings/whatsapp`,
  `PUT /student/settings/whatsapp`,
  `GET/POST /webhooks/whatsapp/{provider}`.

## Key implementation files

- `app/Http/Controllers/Admin/WhatsAppIntegrationController.php`
- `app/Http/Controllers/Webhooks/WhatsAppWebhookController.php`
- `app/Services/WhatsApp/Manager.php`
- `app/Services/WhatsAppService.php`
- `app/Jobs/SendWhatsAppEnrollmentNotificationJob.php`
- `app/Jobs/SendPayoutPaidNotificationJob.php`
- `config/whatsapp_providers.php`

## Edge cases

- Fonnte cannot send templates, so template-based flows skip it.
- Meta error `131047` falls back to the `hello_world` template where supported.
- Duplicate webhook message IDs do not create duplicate rows.
- Notifications are queued; production requires a running queue worker.

## Related guides

- [Enrollment and checkout](enrollment-and-checkout.md)
- [Instructor payouts](instructor-payouts.md)
- [Settings and branding](settings-and-branding.md)
