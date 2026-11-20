# Orders, Refunds and Chargebacks

> Part of the [Feature Documentation](../FEATURES.md) index.

## Overview

An order moves from `pending` to a terminal state such as `paid`, `failed`,
`expired`, `refunded` or `chargeback`. Students see order status and retry
checkout; admins can confirm a payment manually, issue a refund and export
orders. Midtrans webhooks drive most state changes.

## Roles

- **Student** — views order status and retries checkout.
- **Admin** — searches orders, confirms payment, refunds and exports CSV.
- **Midtrans** — sends status and refund/chargeback webhooks.
- **Scheduler** — expires abandoned pending orders.

## Flow

### 1. Order states

1. A paid checkout creates `Order` status `pending` and `Payment` status `pending`.
2. On a valid paid webhook or successful verification:
   - payment and order become `paid`,
   - `paid_at` is set,
   - every order item activates its enrollment,
   - a payout ledger is recorded,
   - a WhatsApp notification may be queued.
3. On failed or expired status, a still-pending payment/order is marked
   accordingly. Previously paid orders are reversed only for `failed` and
   `chargeback` events.
4. `orders:expire` runs every 10 minutes and releases pending orders whose
   `expires_at` has passed.

### 2. Manual confirmation by admin

1. Admin opens `/admin/orders` and searches by status or student name.
2. Admin opens the order detail page.
3. Admin submits a reason of at least 3 characters to **Mark as paid**.
4. The platform verifies the order with Midtrans.
5. If Midtrans does not report `paid`, admin must check **Override**.
6. The action is audited as `manual_confirmed` or `manual_override`.

### 3. Refund

1. Admin opens a paid order and clicks **Refund**.
2. Admin can provide a reason and an optional partial amount.
3. The platform checks that the latest payment is `paid` or `partial_refund`
   and that the channel supports API refunds.
4. `PaymentService::refund()` calls Midtrans with a deterministic `refund_key`,
   stores the `Refund` row and applies the result:
   - **Full refund:** payment → `refunded`, order → `refunded`, enrollments
     revoked, pending payouts cancelled.
   - **Partial refund:** payment → `partial_refund`, order stays `paid`, course
     access remains.
5. A Midtrans refund webhook finalizes an already-initiated refund without
   calling the API again.
6. Unsupported channels show **Refund via Midtrans dashboard** instead.

### 4. Chargeback

1. A chargeback webhook or verification result calls `handleChargeback()`.
2. An idempotent `Refund` row with type `chargeback` is created.
3. Payment and order become `chargeback`.
4. Enrollments are revoked and pending payouts are cancelled.

### 5. Export

Admin can export orders as CSV from `/admin/orders/export`.

## Rules and guards

- Order route key is `order_number`.
- `markPaid()` rejects orders already `paid`, `refunded` or `chargeback`.
- A stale expiry event does not revoke access after settlement.
- Settlement reversal (`deny` after capture/settlement) revokes access and
  payouts.
- Refund retries reuse the same refund key.
- Full refund is detected when refunded amount reaches `amount - 0.01`.
- Partial refund keeps access; full refund revokes all enrollments linked to the
  order.
- API refunds support credit card, GoPay, ShopeePay, DANA, OVO, QRIS, Kredivo
  and Akulaku. Blank legacy payment types may still be attempted.

## Where to find it

- **Student UI:** `resources/js/pages/student/payment/page.tsx`.
- **Admin UI:** `resources/js/pages/admin/orders/page.tsx`,
  `resources/js/pages/admin/orders/show.tsx`.
- **Routes:** `GET /admin/orders`, `GET /admin/orders/export`,
  `GET /admin/orders/{order}`, `PUT /admin/orders/{order}/pay`,
  `POST /admin/orders/{order}/refund`,
  `GET /student/orders/{order:order_number}`.

## Key implementation files

- `app/Http/Controllers/Admin/OrderController.php`
- `app/Http/Controllers/Admin/ExportController.php`
- `app/Http/Controllers/Payment/PaymentWebhookController.php`
- `app/Services/Payment/PaymentService.php`
- `app/Models/Order.php`
- `app/Models/Payment.php`
- `app/Console/Commands/ExpirePendingOrders.php`
- `app/Console/Commands/PruneApplicationDataCommand.php`

## Edge cases

- Unknown orders receive `OK` from the webhook to stop retries.
- A webhook processing error returns 500 so Midtrans retries.
- Chargeback amount defaults to the full payment and is capped at the payment
  amount, but the whole order is marked `chargeback`.
- A refund with HTTP 200 but a non-success status code is treated as failed.
- Payout cancellation follows full refund and chargeback, not partial refund.

## Related guides

- [Enrollment and checkout](enrollment-and-checkout.md)
- [Instructor payouts](instructor-payouts.md)
- [Scheduled maintenance](scheduled-maintenance.md)
