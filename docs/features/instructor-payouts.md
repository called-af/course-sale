# Instructor Payouts

> Part of the [Feature Documentation](../FEATURES.md) index.

## Overview

Each paid order creates a payout ledger for the course instructor. The ledger
becomes payable after a hold period, provided the instructor has a complete bank
account, the account lock has expired and the available amount meets the minimum.
Admin can pay one ledger or batch-pay all available ledgers for an instructor.

## Roles

- **Instructor** — manages bank details, views the ledger and receives payout
  notifications.
- **Admin** — views, exports and marks payouts paid.
- **System** — creates ledgers on paid orders and cancels them on refund or
  chargeback.

## Flow

### 1. Set up a payout account

1. Instructor opens `/instructor/settings`.
2. Instructor fills bank name, account number, account holder and any other
   required bank fields.
3. The current password is required when saving or changing bank details.
4. The account number is encrypted in storage and masked in the UI.
5. A `PayoutAccountAudit` record is written and `payout_account_updated_at` is set.
6. Payouts are locked for the configured number of hours after the change.

### 2. Accumulate a ledger

1. A paid order creates an `InstructorPayout` row.
2. The platform fee is deducted using the admin-configured platform fee percent.
3. `available_at` is set to the payment time plus the payout hold days.
4. A ledger becomes payable only when all of the following are true:
   - status is `pending`,
   - `available_at` is null or in the past,
   - bank details are complete,
   - the account lock has expired,
   - the total available amount meets the configured minimum.

### 3. Mark one payout paid

1. Admin opens `/admin/payouts`.
2. Admin filters or searches the ledger and opens a payout.
3. Admin clicks **Mark as paid**.
4. The ledger status becomes `paid`, and a WhatsApp notification job may be queued.

### 4. Batch pay

1. Admin selects an instructor and clicks **Batch pay** on `/admin/payouts`.
2. The platform locks the rows with `lockForUpdate()`.
3. A reference like `BATCH-YmdHis-{instructorId}` is generated.
4. All available ledgers for that instructor are marked paid.
5. Payout notification jobs are dispatched.

### 5. Export

Admin can export payouts to CSV from `/admin/payouts/export`. The export
contains decrypted account numbers; access is admin-only and the action is
logged with the admin ID and instructor count.

## Rules and guards

- Payout hold days: 0–90, default 7.
- Minimum payout: greater than or equal to 0, default 100000.
- Account lock hours: 0–168, default 24.
- Platform fee: 0–100%, default 20%.
- Changing bank details requires the current password.
- Admin cannot mark a payout paid before `available_at`, below the minimum or
  with an incomplete bank account.
- Full refund and chargeback cancel pending payouts; partial refund does not.
- Instructor payout account changes are audited.

## Where to find it

- **Instructor UI:** `resources/js/pages/instructor/settings/General.tsx`.
- **Admin UI:** `resources/js/pages/admin/payouts/page.tsx`.
- **Routes:** `GET /admin/payouts`, `GET /admin/payouts/export`,
  `PUT /admin/payouts/batch`, `PUT /admin/payouts/{payout}/pay`,
  `PUT /instructor/settings/payout`.

## Key implementation files

- `app/Http/Controllers/Admin/PayoutController.php`
- `app/Http/Controllers/Instructor/InstructorSettingsController.php`
- `app/Http/Controllers/Admin/ExportController.php`
- `app/Services/Payment/PaymentService.php`
- `app/Services/Payment/PaymentSettings.php`
- `app/Models/InstructorPayout.php`
- `app/Jobs/SendPayoutPaidNotificationJob.php`

## Edge cases

- A recently changed bank account blocks payouts until the lock expires.
- Batch pay skips ledgers that are not yet available.
- Failed/expired orders do not create a payable ledger.
- Payout notifications are queued; the worker must be running in production.

## Related guides

- [Orders, refunds and chargebacks](orders-refunds-and-chargebacks.md)
- [Settings and branding](settings-and-branding.md)
- [WhatsApp notifications](whatsapp-notifications.md)
- [Scheduled maintenance](scheduled-maintenance.md)
