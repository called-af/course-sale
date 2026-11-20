# Enrollment and Midtrans Checkout

> Part of the [Feature Documentation](../FEATURES.md) index.

## Overview

Students enroll in free courses immediately. Paid courses create an order and
send the student to Midtrans Snap. The webhook, not the browser, is the
authoritative source for granting access. Revoked or expired free enrollments
can be reactivated; revoked or expired paid enrollments must go through checkout
again.

## Roles

- **Student** — enrolls, pays and returns to the learning page.
- **Instructor** — may receive a WhatsApp enrollment notification.
- **Midtrans** — sends payment-status webhooks.
- **System** — tracks enrollment events and creates payout ledgers.

## Flow

### 1. Free enrollment

1. Student opens a published course detail page.
2. Student clicks **Enroll**.
3. `POST /course/{course:slug}/enroll` checks that the user has role `student`.
4. `EnrollmentService::enroll()` confirms the course is published.
5. If an active enrollment already exists, no new enrollment is created.
6. Otherwise a new `active` enrollment is created, or a `revoked`/`expired`
   enrollment is reactivated with a fresh `enrolled_at`.
7. The platform tracks a `course_enroll` event and queues a WhatsApp
   notification if the instructor enabled it.
8. Student is redirected to the learning page with a success message.

### 2. Paid checkout

1. Student clicks **Buy** on the course detail page or opens
   `GET /student/courses/{course:slug}/checkout`.
2. The page loads available Midtrans methods from the payment settings.
3. Student selects a method, or the first active method is used.
4. `POST /student/courses/{course:slug}/checkout` calls
   `PaymentService::createOrder()`.
5. The service first resolves any existing pending order:
   - locally expired → released as `expired`;
   - already paid at the gateway → marked paid;
   - not found / failed / expired / refunded / chargeback → released locally;
   - gateway unreachable → the existing pending order is reused.
6. A new order number `ORD-Ymd-XXXXXX` is created with a 24-hour expiry, together
   with an order item snapshot and a payment row.
7. The service calls Midtrans Snap and stores the Snap token in
   `payment.reference` and the redirect URL in `payment.payment_url`.
8. The controller uses `Inertia::location()` to navigate the browser to Snap.
9. Student pays on Midtrans; Midtrans calls the webhook.
10. On a paid webhook, the order and payment become `paid`, the enrollment is
    activated, a payout ledger is recorded and a WhatsApp job may be queued.

### 3. Payment status page

`GET /student/orders/{order:order_number}` shows the current order. While a
Midtrans payment is pending, the page refreshes the gateway status and polls
every 12 seconds. Failed or expired orders show a **Retry checkout** action.

### 4. Webhook verification

`POST /payments/midtrans/webhook` is unauthenticated but throttled and verified:

1. Requires `order_id`, `status_code`, `gross_amount` and `signature_key`.
2. Recomputes `sha512(order_id + status_code + gross_amount + server_key)` and
   compares it with `hash_equals`.
3. Checks merchant ID and amount against the local order.
4. Acknowledges unknown orders with `OK` so Midtrans stops retrying.
5. Maps the transaction status and calls the matching service action.
6. Returns 500 on processing errors so Midtrans retries.

Status mapping highlights: `settlement` → paid; `capture` with fraud `accept` →
paid; `challenge` → challenge; `expire` → expired; `deny`/`cancel`/`failure` →
failed; `refund` → refunded; `partial_refund` → partial refund;
`chargeback` → chargeback.

## Rules and guards

- Enrollment endpoint requires `role:student`.
- Course must be `status = published`.
- Active enrollment prevents double purchase.
- Currency is fixed to IDR.
- Midtrans is the only payment gateway.
- Production mode rejects sandbox keys; sandbox mode rejects production keys.
- Order numbers retry up to 5 times on collision.
- Paid access is granted only through `markPaid()`, which is idempotent.

## Where to find it

- **UI:** `resources/js/pages/course/[slug]/page.tsx`,
  `resources/js/pages/student/checkout/page.tsx`,
  `resources/js/components/organisms/Payment/CheckoutPanel.tsx`,
  `resources/js/pages/student/payment/page.tsx`.
- **Routes:** `POST /course/{course:slug}/enroll`,
  `GET/POST /student/courses/{course:slug}/checkout`,
  `GET /student/orders/{order:order_number}`,
  `POST /payments/midtrans/webhook`.

## Key implementation files

- `app/Http/Controllers/EnrollmentController.php`
- `app/Services/EnrollmentService.php`
- `app/Http/Controllers/Payment/CheckoutController.php`
- `app/Http/Controllers/Payment/PaymentController.php`
- `app/Http/Controllers/Payment/PaymentWebhookController.php`
- `app/Services/Payment/PaymentService.php`
- `app/Services/Payment/MidtransPaymentGateway.php`
- `app/Jobs/SendWhatsAppEnrollmentNotificationJob.php`

## Edge cases

- A gateway outage during retry keeps the existing order instead of creating a
  duplicate Snap transaction.
- A stale `expire` webhook after settlement does not revoke access.
- `challenge` and generic pending statuses do not grant access.
- WhatsApp notification failures are logged and do not fail enrollment.
- Instructors and admins cannot use the student enrollment endpoint.

## Related guides

- [Orders, refunds and chargebacks](orders-refunds-and-chargebacks.md)
- [Learning and progress](learning-and-progress.md)
- [Instructor payouts](instructor-payouts.md)
- [WhatsApp notifications](whatsapp-notifications.md)
