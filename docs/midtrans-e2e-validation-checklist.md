# Midtrans E2E Validation Checklist (Sandbox / Production-like)

Concrete checklist for validating the Midtrans payment flow end-to-end in
**sandbox** or **production-like** environments (staging with credentials and
configuration resembling production).

> **Principles**
>
> - The Midtrans webhook is the source of truth for final status; polling/status
>   checks from the UI are best-effort only.
> - All verification must happen in an environment isolated from real production data.
> - Record `order_number`, `payment_id`, `transaction_id`, relevant webhook
>   payloads (headers/body without leaking secrets), application logs, and
>   screenshots for every scenario.

---

## 0) Prerequisites & configuration

- [ ] **App/infra**
    - [ ] `APP_ENV`, `APP_URL` (HTTPS), trusted proxy, secure session cookie and
          timezone match the environment.
    - [ ] Storage link/permissions OK; queue worker and scheduler active
          (`php artisan schedule:work` / cron `schedule:run`, `queue:work` if
          notifications/jobs are used).
    - [ ] DB backup/staging snapshot available; migrations and payment seeding
          (`midtrans` provider/methods, payment settings) are correct.
- [ ] **Midtrans configuration** (`services.payment.midtrans.*` / admin settings)
    - [ ] Mode matches the environment: **sandbox** (`MIDTRANS_IS_PRODUCTION=false`,
          `SB-...` keys, sandbox hosts) or **production-like/production**
          (`MIDTRANS_IS_PRODUCTION=true`, production keys, production hosts).
          Never mix key/host/mode.
    - [ ] `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_MERCHANT_ID` are valid.
    - [ ] Currency is **IDR** (Snap only supports IDR).
    - [ ] `services.payment.midtrans.timeout` is reasonable; admin diagnostics/
          health checks show no critical issue.
- [ ] **Webhook**
    - [ ] Public URL reachable by Midtrans:
          `POST {APP_URL}/payments/midtrans/webhook` (route `payment.webhook.midtrans`,
          throttled by `payment-webhooks`).
    - [ ] Valid HTTPS (production-like), not wrongly blocked by auth/CSRF/firewall/WAF.
    - [ ] Signature is verified (SHA512 of
          `order_id+status_code+gross_amount+server_key`); amount/gross is verified
          against the payment.
- [ ] **Test accounts**
    - [ ] Student, instructor (with complete payout bank details if testing payouts), admin.
    - [ ] Paid course (published, with an instructor/creator for payout ledger)
          and/or a free course as a control.
- [ ] **Scheduler/command**
    - [ ] `php artisan orders:expire` is scheduled (~every 10 minutes, no overlap)
          and can be run manually: `php artisan orders:expire`.

## 1) Checkout and order/transaction creation

- [ ] **Happy path (paid course)**
    - [ ] Student checks out a paid course → `pending` order + `pending` payment
          created, redirect/Inertia location to the Snap URL, `payment_url`/
          reference saved.
    - [ ] Item/order amount, currency (IDR), customer detail and expiry are sent
          correctly; order has `expires_at`.
- [ ] **Enrollment guard**
    - [ ] An already enrolled/active student **cannot** create another order or be
          double-charged (redirect/info as designed).
    - [ ] A free course activates enrollment immediately (not a Midtrans flow).
- [ ] **Methods/gateway**
    - [ ] Only active Midtrans provider methods are available; if gateway/mode/
          config is not ready, a clear error is returned without creating a
          misleading half-finished transaction.
- [ ] **Checkout idempotency/retry**
    - [ ] Double-click/parallel requests do not produce duplicate/problematic
          orders or transactions; a still-valid pending order can be reused.
    - [ ] If the previous gateway transaction was cancelled/expired/not_found,
          the old order is released (failed/expired) and checkout creates a new
          valid transaction/order.
    - [ ] If the gateway was already settled (paid) during retry/resolve, the order
          is marked paid and enrollment is granted (without starting a new
          double-charge flow).
    - [ ] **Order number collision** (rare): order creation still succeeds via
          retry/unique generation; it does not fail because of a collision.

## 2) Pending, payment page and expiry

- [ ] **Payment page** (`/student/orders/{order_number}` / related route)
    - [ ] Only the owner (or admin) can access it; order/payment/course/gateway
          status and info are shown correctly.
    - [ ] Best-effort status refresh (verify) does not corrupt final state; a
          gateway outage does not break the page.
- [ ] **Expiry**
    - [ ] `orders:expire` expires pending orders past `expires_at`: order/payment →
          `expired`, remote transaction expired best-effort.
    - [ ] Already `paid`/non-pending orders are untouched by the command.
    - [ ] A pending order without `expires_at` is not wrongly expired (expected behavior).
    - [ ] After local/gateway expiry, an old Snap page cannot change state to a
          valid `paid` state (UI directs the user to retry/new checkout).

## 3) Success (settlement/capture)

- [ ] **Settlement webhook** (`transaction_status=settlement`, valid signature and gross)
    - [ ] Payment & order → `paid`, `paid_at` filled, enrollment active for the
          item/course, events/logs recorded, instructor payout ledger created
          (gross/platform_fee/net, `available_at` per hold period).
    - [ ] **Idempotent**: resending the same notification does not duplicate
          enrollment, payouts or side effects.
- [ ] **Capture (credit card)**
    - [ ] `capture` + `fraud_status=accept` → paid + enrollment.
    - [ ] `capture` + `fraud_status=challenge` → **not** paid, **no** access granted
          (pending/review as mapped).
    - [ ] Other fraud/deny capture paths → no access granted (failed/rejected as mapped).

## 4) Failed / denied / cancelled (before and after settlement)

- [ ] **Pending/unpaid**: `deny`/`cancel`/`failure`/`expire` before paid →
      order/payment `failed`/`expired` as appropriate, **no** active enrollment.
- [ ] **Reversal after paid** (e.g. deny/cancel reversal)
    - [ ] Access is revoked (enrollment revoked) and pending payout cancelled;
          order/payment becomes `failed` (not a wrong stale-expiry state).
    - [ ] A late `expire` notification after settlement **does not** revoke access
          (safe stale delivery).
- [ ] **Unknown/invalid notifications**
    - [ ] Invalid signature → rejected (403), state unchanged.
    - [ ] Merchant mismatch (if configured) → rejected.
    - [ ] `gross_amount` mismatching the payment amount → rejected (422), state unchanged.
    - [ ] Unknown order → acknowledged (200) so provider retries stop, without
          harmful side effects.

## 5) Webhook: retry, duplication and consistency

- [ ] Resend identical success/failure/refund/chargeback events multiple times →
      **idempotent** (no double-apply, double refund or double enrollment).
- [ ] Out-of-order events (e.g. notify after state is already final) do not
      incorrectly downgrade a stronger state (paid/refunded/chargeback protected).
- [ ] All important transitions are recorded in `payment_logs`/relevant audit trail.

## 6) Admin manual confirmation (mark paid) & override

- [ ] Pending order with gateway verification = paid → confirmation succeeds,
      enrollment and payout created, `manual_confirmed` log written.
- [ ] Gateway has not confirmed paid → rejected with status message without
      override; with `override` + reason → recorded as `manual_override` (use only
      with valid evidence).
- [ ] Order already `paid` → info/idempotent; `refunded`/`chargeback` order →
      **rejected** (access must not be reactivated via mark-paid).
- [ ] No valid pending payment → clear error, no arbitrary mutation.

## 7) Refund (full/partial, channel, async)

- [ ] **API-supported channels** (e.g. credit_card/gopay/shopeepay/qris/dana/ovo/
      kredivo/akulaku per gateway policy)
    - [ ] **Full refund** via admin/API: calls the Midtrans refund API, success →
          payment/order `refunded`, access revoked, pending payout cancelled,
          successful refund record stored.
    - [ ] **Partial refund**: payment `partial_refund`, order stays `paid`, access
          **stays active**; remaining amount refunded until fully refunded → full
          refunded and access revoked.
    - [ ] **Invalid amount** (<=0 or above remainder) is rejected.
- [ ] **Channels without API support** (e.g. certain VA/echannel)
    - [ ] UI/action rejects API refund and directs to manual processing in the
          Midtrans dashboard; **no** incorrect refund API call is made.
- [ ] **API error / HTTP 200 with error status_code**
    - [ ] Not treated as success; payment/order does not change to refunded;
          failure recorded (audit trail/refund failed) for investigation.
- [ ] **Refund retry**
    - [ ] Retry uses the same `refund_key` (idempotent at system/gateway side),
          no duplicated effect.
- [ ] **Async refund**
    - [ ] Pending response → refund recorded as pending without prematurely
          revoking access/payout; a later success webhook/notification finalizes →
          refunded + access/payout revoked.
- [ ] **Refund/partial_refund webhook**
    - [ ] Updates state and revocation accordingly (without calling the refund API
          again); idempotent against duplicates.

## 8) Chargeback

- [ ] Chargeback/partial_chargeback notification → payment/order `chargeback`,
      amount recorded, dispute/refund record `type=chargeback` successful,
      **access revoked**, pending payout cancelled.
- [ ] Idempotent against repeated notifications (dedupe key/record).
- [ ] For orders/items/payouts already `paid` to the instructor: ensure it is
      recorded as an operational/finance case (do not automatically claw back a
      completed bank transfer) — verify against the business process.

## 9) Payout (creation, hold, cancel, batch, export)

- [ ] **Ledger creation**: when an order is paid, a per-item/course ledger is
      created idempotently with the correct fee/platform split.
- [ ] **Hold period**: ledger is not `available` before `available_at`; admin
      cannot mark/batch/export-ready before the hold ends.
- [ ] **Eligibility**: instructor bank details complete, not locked (lock after
      bank change), and minimum payout met.
- [ ] **Mark paid (single) & batch**: only `pending`, available and eligible
      ledgers; status/paid_at/reference/notes filled; related notifications/jobs
      (if any) triggered once as designed.
- [ ] **Cancel**: full refund/chargeback/reversal cancels **pending** payout with
      a reason; an already **paid** payout is not automatically changed
      (documented operational limitation).
- [ ] **CSV export**: only ready/eligible payouts per rules, correct
      instructor/bank/total data, admin-only access, and logged where applicable.

## 10) Enrollment and learning-access effects

- [ ] Paid/settlement → enrollment `active` (material/learning access per rules).
- [ ] Full refund/chargeback/reversal after paid → enrollment `revoked`
      (learning/certificate/resource/progress gate follows revoke status).
- [ ] Partial refund (not fully settled) → enrollment stays active.
- [ ] Free course/non-payment flows are not regressed.

## 11) Observability & operations

- [ ] `payment_logs` / application logs record key events (created, paid,
      failed/expired, reversed, refund pending/success/failed, chargeback,
      manual_confirm/override) with safe context.
- [ ] Alert/monitoring: spikes in 403/422 webhook responses, verify/refund
      errors, queue backlog, `orders:expire` scheduler failures.
- [ ] Test **sandbox** with different channels (e.g. QRIS/VA/e-wallet/card) and
      **production-like** with a small amount plus rollback/reconciliation procedure.

## 12) Pass criteria

- [ ] All critical scenarios (success, expiry, failure, duplicate webhook,
      full/partial/async/unsupported refund, chargeback, reversal, payout
      hold/cancel/batch/export, admin/manual guards) pass without state
      inconsistency (order/payment/enrollment/payout/refund).
- [ ] No double-charge, double-enroll, double-payout or double-applied refund in
      idempotency/concurrency tests.
- [ ] Manual reconciliation (Midtrans dashboard vs DB vs payout ledger) is clean
      for the test sample.
