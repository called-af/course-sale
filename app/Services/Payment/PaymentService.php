<?php

namespace App\Services\Payment;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\InstructorPayout;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PaymentLog;
use App\Models\PaymentMethod;
use App\Models\Refund;
use App\Models\User;
use App\Services\EnrollmentService;
use App\Services\EventTrackingService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaymentService
{
    public function __construct(protected PaymentSettings $paymentSettings) {}

    public function availableMethods(): array
    {
        $gateway = $this->paymentSettings->current()->gateway;

        if ($gateway !== 'midtrans' || ! filled(config('services.payment.midtrans.server_key'))) {
            return [];
        }

        return PaymentMethod::query()
            ->with('provider')
            ->whereHas('provider', fn ($query) => $query
                ->where('is_active', true)
                ->where('code', 'midtrans'))
            ->orderBy('name')
            ->get()
            ->map(fn (PaymentMethod $method) => [
                'id' => $method->id,
                'name' => $method->name,
                'code' => $method->code,
                'provider' => [
                    'id' => $method->provider_id,
                    'name' => $method->provider?->name,
                    'code' => $method->provider?->code,
                ],
            ])
            ->values()
            ->all();
    }

    /**
     * Pick a sensible default method when the student does not choose one.
     *
     * With Midtrans Snap the actual payment channel is chosen on Midtrans'
     * hosted page, so the app only needs a valid method record to attach to
     * the order.
     */
    public function defaultMethod(): ?PaymentMethod
    {
        $methods = $this->availableMethods();

        if ($methods === []) {
            return null;
        }

        return PaymentMethod::query()
            ->with('provider')
            ->find($methods[0]['id']);
    }

    /**
     * Resolve the gateway implementation for a payment method's provider.
     */
    public function gatewayFor(PaymentMethod $method): PaymentGatewayInterface
    {
        $method->loadMissing('provider');

        return match ($method->provider?->code) {
            'midtrans' => app(MidtransPaymentGateway::class),
            default => throw new \RuntimeException('Payment gateway tidak tersedia.'),
        };
    }

    public function createOrder(User $user, Course $course, PaymentMethod $method): Order|Enrollment
    {
        if (! $course->isPaid()) {
            return DB::transaction(fn () => app(EnrollmentService::class)->activate($user, $course));
        }

        if (app(EnrollmentService::class)->isEnrolled($user, $course)) {
            throw new \RuntimeException('Anda sudah terdaftar di course ini.');
        }

        $currency = strtoupper((string) $this->paymentSettings->current()->currency);

        // Snap only accepts IDR. Locking the currency here prevents an admin
        // setting from silently breaking every new transaction.
        if ($currency !== 'IDR') {
            throw new \RuntimeException('Midtrans hanya mendukung mata uang IDR.');
        }

        // A pending order can look valid locally while the gateway already
        // cancelled or expired it. Resolve that first so "retry checkout"
        // never sends the student back to a dead Snap page.
        $reusable = $this->resolvePendingOrder($user, $course);

        if ($reusable) {
            return $reusable;
        }

        $lastException = null;

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            try {
                return DB::transaction(function () use ($user, $course, $method, $currency) {
                    $method->loadMissing('provider');

                    $activeGateway = $this->paymentSettings->current()->gateway;
                    $providerCode = $method->provider?->code ?? 'midtrans';

                    if ($providerCode !== $activeGateway) {
                        throw new \RuntimeException('Metode pembayaran tidak tersedia untuk gateway aktif.');
                    }

                    // Concurrent requests can slip in before the transaction above
                    // commits; reuse whatever pending order won the race.
                    $existing = Order::query()
                        ->where('user_id', $user->id)
                        ->whereHas('items', fn ($query) => $query->where('course_id', $course->id))
                        ->where('status', 'pending')
                        ->latest('id')
                        ->first();

                    if ($existing) {
                        return $existing;
                    }

                    $order = Order::create([
                        'user_id' => $user->id,
                        'order_number' => $this->generateOrderNumber(),
                        'total_price' => (float) $course->price,
                        'currency' => $currency,
                        'status' => 'pending',
                        'payment_method_id' => $method->id,
                        'expires_at' => now()->addHours(24),
                    ]);

                    OrderItem::create([
                        'order_id' => $order->id,
                        'course_id' => $course->id,
                        'course_title' => $course->title,
                        'course_price' => (float) $course->price,
                    ]);

                    $payment = Payment::create([
                        'order_id' => $order->id,
                        'provider_id' => $method->provider_id,
                        'reference' => 'PAY-'.strtoupper($order->order_number),
                        'amount' => (float) $course->price,
                        'currency' => $currency,
                        'status' => 'pending',
                    ]);

                    $transaction = $this->gatewayFor($method)->createTransaction((float) $course->price, [
                        'order_number' => $order->order_number,
                        'payment_method' => $method->code,
                        'customer_name' => $user->name,
                        'customer_email' => $user->email,
                        'customer_phone' => $user->whatsapp_number,
                        'currency' => $currency,
                        'finish_url' => route('student.payment.show', ['order' => $order->order_number]),
                        'course_id' => $course->id,
                        'item_name' => $course->title,
                    ]);

                    $payment->update([
                        'reference' => $transaction['provider_ref'] ?: $payment->reference,
                        'payment_url' => $transaction['payment_url'] ?? null,
                    ]);

                    if (! empty($transaction['expires_at'])) {
                        $order->update(['expires_at' => $transaction['expires_at']]);
                    }

                    $this->log($payment, 'created', [
                        'gateway' => $providerCode,
                        'provider_ref' => $transaction['provider_ref'] ?? null,
                        'currency' => $currency,
                    ]);

                    return $order->fresh(['items', 'payments']);
                });
            } catch (\Throwable $exception) {
                if ($this->isOrderNumberCollision($exception)) {
                    $lastException = $exception;

                    // Another request may have won the race and created a usable
                    // pending order for this user/course; reuse it if present.
                    $existing = Order::query()
                        ->where('user_id', $user->id)
                        ->whereHas('items', fn ($query) => $query->where('course_id', $course->id))
                        ->where('status', 'pending')
                        ->latest('id')
                        ->first();

                    if ($existing) {
                        return $existing;
                    }

                    continue;
                }

                throw $exception;
            }
        }

        throw new \RuntimeException('Gagal membuat nomor pesanan unik. Silakan coba lagi.', 0, $lastException);
    }

    /**
     * Find a pending order that can still be paid, checking the gateway when
     * the local record alone is not conclusive.
     *
     * Returns the order to reuse (or a newly paid one), or null when a fresh
     * transaction should be created.
     */
    protected function resolvePendingOrder(User $user, Course $course): ?Order
    {
        $orders = Order::query()
            ->where('user_id', $user->id)
            ->whereHas('items', fn ($query) => $query->where('course_id', $course->id))
            ->where('status', 'pending')
            ->latest('id')
            ->get();

        foreach ($orders as $order) {
            $stillValid = $order->expires_at === null || $order->expires_at->isFuture();

            if (! $stillValid) {
                $this->releaseOrder($order, 'expired');

                continue;
            }

            $payment = $order->payments()->with('provider')->latest('id')->first();

            // Non-Midtrans gateways have no remote status to consult.
            if (! $payment || $payment->provider?->code !== 'midtrans') {
                return $order;
            }

            try {
                $result = app(MidtransPaymentGateway::class)->verify($order->order_number);
                $status = $result['status'] ?? 'pending';
            } catch (\Throwable $exception) {
                // If the gateway cannot be reached, keep the current order
                // rather than risking a duplicate transaction.
                report($exception);

                return $order;
            }

            if ($status === 'paid') {
                return $this->markPaid($payment, $result['transaction'] ?? []);
            }

            if ($status === 'not_found') {
                $this->releaseOrder($order, 'expired');

                continue;
            }

            if (in_array($status, ['failed', 'expired', 'refunded', 'chargeback'], true)) {
                $this->releaseOrder($order, $status === 'chargeback' ? 'failed' : $status);

                continue;
            }

            return $order;
        }

        return null;
    }

    /**
     * Close a pending order and its pending payment locally, and tell the
     * gateway so an old Snap page cannot be paid after a retry.
     */
    public function releaseOrder(Order $order, string $status): bool
    {
        $payment = $order->payments()->with('provider')->latest('id')->first();
        $released = false;

        DB::transaction(function () use ($order, $status, &$released) {
            $locked = Order::query()->whereKey($order->id)->lockForUpdate()->first();

            if (! $locked || $locked->status !== 'pending') {
                return;
            }

            $locked->payments()->where('status', 'pending')->update(['status' => $status]);
            $locked->update(['status' => $status]);
            $released = true;
        });

        if (! $released || ! $payment || $payment->provider?->code !== 'midtrans') {
            return $released;
        }

        try {
            $gateway = app(MidtransPaymentGateway::class);

            $status === 'expired'
                ? $gateway->expire($order->order_number)
                : $gateway->cancel($order->order_number);
        } catch (\Throwable $exception) {
            // Local state is authoritative for our UI; the remote call is
            // best-effort protection against double payment.
            Log::warning('Failed to release Midtrans transaction remotely.', [
                'order_number' => $order->order_number,
                'status' => $status,
                'error' => $exception->getMessage(),
            ]);
        }

        return true;
    }

    /**
     * Mark a payment as paid and grant access to every course in the order.
     *
     * @param  array<string, mixed>  $transaction  Normalized Midtrans fields.
     */
    public function markPaid(Payment $payment, array $transaction = []): Order
    {
        return DB::transaction(function () use ($payment, $transaction) {
            $lockedPayment = Payment::query()->whereKey($payment->id)->lockForUpdate()->firstOrFail();
            $order = Order::query()->whereKey($lockedPayment->order_id)->lockForUpdate()->first();

            if (! $order) {
                throw new \RuntimeException('Payment is not linked to an order.');
            }

            if ($transaction !== []) {
                $lockedPayment->forceFill($transaction)->save();
            }

            if (in_array($order->status, ['paid', 'refunded', 'chargeback'], true)
                || in_array($lockedPayment->status, ['refunded', 'chargeback'], true)) {
                return $order;
            }

            $paidAt = now();

            $lockedPayment->update([
                'status' => 'paid',
                'paid_at' => $paidAt,
            ]);

            $order->update([
                'status' => 'paid',
                'paid_at' => $paidAt,
            ]);

            $order->loadMissing('items.course', 'user');

            foreach ($order->items as $item) {
                $course = $item->course;
                $user = $order->user;

                if (! $course || ! $user) {
                    continue;
                }

                $enrollment = app(EnrollmentService::class)->activate($user, $course);

                app(EventTrackingService::class)->trackCourseEnroll($user, $course);
                app(EnrollmentService::class)->dispatchWhatsAppNotification($enrollment, $course, $user);
            }

            $this->recordPayouts($order, $lockedPayment);

            $this->log($lockedPayment, 'paid', ['order_number' => $order->order_number]);

            return $order;
        });
    }

    /**
     * Mark a payment as failed/expired. If the payment was already paid (or
     * partially refunded, which still carries active access for the remainder)
     * this is a settlement reversal (e.g. deny after settlement), so access and
     * pending payouts must be revoked too.
     *
     * @param  array<string, mixed>  $transaction
     */
    public function markUnpaid(Payment $payment, string $status = 'failed', array $transaction = []): Payment
    {
        if (! in_array($status, ['failed', 'expired', 'chargeback'], true)) {
            $status = 'failed';
        }

        return DB::transaction(function () use ($payment, $status, $transaction) {
            $lockedPayment = Payment::query()->whereKey($payment->id)->lockForUpdate()->firstOrFail();
            $order = Order::query()->whereKey($lockedPayment->order_id)->lockForUpdate()->first();

            if ($transaction !== []) {
                $lockedPayment->forceFill($transaction)->save();
            }

            if (in_array($lockedPayment->status, ['refunded', 'chargeback'], true)) {
                return $lockedPayment;
            }

            if (in_array($lockedPayment->status, ['paid', 'partial_refund'], true)) {
                if ($status === 'expired') {
                    // An expiry notification after settlement is a stale
                    // delivery; never revoke access because of it.
                    return $lockedPayment;
                }

                $finalStatus = $status === 'chargeback' ? 'chargeback' : 'failed';
                $lockedPayment->update(['status' => $finalStatus]);

                if ($order) {
                    $order->update(['status' => $finalStatus]);
                    $this->revokeEnrollments($order);
                    $this->cancelPayouts($order, 'Pembayaran dibatalkan/di-reverse oleh gateway.');
                }

                $this->log($lockedPayment, 'reversed', [
                    'order_number' => $order?->order_number,
                    'status' => $status,
                    'previous_status' => $payment->status,
                ]);

                return $lockedPayment;
            }

            if ($lockedPayment->status === 'pending') {
                $lockedPayment->update(['status' => $status]);
            }

            if ($order && $order->status === 'pending') {
                $order->update(['status' => $status]);
            }

            $this->log($lockedPayment, $status, ['order_number' => $order?->order_number]);

            return $lockedPayment;
        });
    }

    /**
     * Record a chargeback (full or partial) and revoke course access.
     *
     * @param  array<string, mixed>  $payload
     */
    public function handleChargeback(Payment $payment, float $amount = 0.0, array $payload = []): Refund
    {
        $payment->loadMissing('order');

        $amount = $amount > 0 ? $amount : (float) $payment->amount;
        $amount = min($amount, (float) $payment->amount);

        if ($amount <= 0) {
            throw new \RuntimeException('Nominal chargeback tidak valid.');
        }

        $refundKey = 'CB-'.strtoupper(substr(hash('sha256', $payment->order?->order_number.'|'.$payment->id.'|'.(int) round($amount)), 0, 30));

        return DB::transaction(function () use ($payment, $amount, $payload, $refundKey) {
            $lockedPayment = Payment::query()->whereKey($payment->id)->lockForUpdate()->firstOrFail();
            $order = Order::query()->whereKey($lockedPayment->order_id)->lockForUpdate()->first();

            $existing = Refund::query()->where('refund_key', $refundKey)->first();

            if ($existing) {
                return $existing;
            }

            $chargebackTotal = min(
                (float) $lockedPayment->amount,
                (float) $lockedPayment->chargeback_amount + $amount,
            );

            $refund = Refund::create([
                'payment_id' => $lockedPayment->id,
                'refund_key' => $refundKey,
                'amount' => $amount,
                'reason' => 'Chargeback dari penerbit kartu',
                'status' => 'success',
                'provider_status' => strtolower((string) ($payload['transaction_status'] ?? 'chargeback')),
                'type' => 'chargeback',
                'refunded_at' => now(),
                'raw' => $payload ?: null,
            ]);

            $lockedPayment->update([
                'status' => 'chargeback',
                'chargeback_amount' => $chargebackTotal,
                'midtrans_status' => strtolower((string) ($payload['transaction_status'] ?? 'chargeback')),
            ]);

            if ($order) {
                $order->update([
                    'status' => 'chargeback',
                    'chargeback_amount' => $chargebackTotal,
                ]);

                $this->revokeEnrollments($order);
                $this->cancelPayouts($order, 'Order terkena chargeback.');
            }

            $this->log($lockedPayment, 'chargeback', [
                'order_number' => $order?->order_number,
                'amount' => $amount,
            ]);

            return $refund;
        });
    }

    /**
     * Refund a payment. Repeated calls with the same refund context return the
     * existing record instead of double-refunding.
     *
     * @param  array<string, mixed>  $meta
     */
    public function refund(
        Payment $payment,
        string $reason,
        bool $callProvider = true,
        ?float $amount = null,
        string $type = 'manual',
        array $meta = [],
    ): Refund {
        $payment->loadMissing('order', 'provider');

        $remaining = $payment->refundableAmount();
        $amount = $amount === null ? $remaining : round($amount, 2);

        if ($amount <= 0) {
            throw new \RuntimeException('Tidak ada nominal yang bisa direfund.');
        }

        if ($amount > $remaining + 0.01) {
            throw new \RuntimeException('Nominal refund melebihi sisa pembayaran yang bisa direfund.');
        }

        $orderNumber = (string) $payment->order?->order_number;
        $refundKey = (string) ($meta['refund_key'] ?? '');
        $refundKey = $refundKey !== ''
            ? $refundKey
            : 'REF-'.strtoupper(substr(hash('sha256', $orderNumber.'|'.$payment->id.'|'.number_format($amount, 2, '.', '').'|'.$type), 0, 30));

        $existing = Refund::query()->where('refund_key', $refundKey)->first();

        if ($existing && $existing->status === 'success') {
            return $existing;
        }

        // Provider notifications do not always repeat the exact refund_key,
        // so match a pending/successful refund by payment and amount too.
        if (! $callProvider) {
            $matching = Refund::query()
                ->where('payment_id', $payment->id)
                ->where('amount', $amount)
                ->whereIn('status', ['pending', 'success'])
                ->latest('id')
                ->first();

            if ($matching) {
                return $matching->status === 'pending' ? $this->finalizeRefund($matching) : $matching;
            }
        }

        if ($existing && $existing->status === 'pending' && (! $callProvider || ($meta['provider_status'] ?? '') === 'success')) {
            return $this->finalizeRefund($existing);
        }

        if ($callProvider && ! $payment->supportsApiRefund()) {
            throw new \RuntimeException(
                'Channel pembayaran ini tidak mendukung refund melalui API Midtrans. Lakukan refund manual melalui dashboard Midtrans.'
            );
        }

        $providerResult = [];

        if ($callProvider) {
            try {
                $providerResult = app(MidtransPaymentGateway::class)->refund(
                    $orderNumber,
                    $amount,
                    $reason,
                    [
                        'refund_key' => $refundKey,
                        'payment_type' => (string) $payment->payment_type,
                    ],
                );
            } catch (\Throwable $exception) {
                // Keep an audit trail so finance can see a failed attempt and
                // retry with the same refund_key.
                Refund::updateOrCreate(
                    ['refund_key' => $refundKey],
                    [
                        'payment_id' => $payment->id,
                        'amount' => $amount,
                        'reason' => $reason,
                        'status' => 'failed',
                        'type' => $type,
                        'raw' => ['error' => $exception->getMessage()],
                        'requested_by' => $meta['requested_by'] ?? null,
                    ],
                );

                $this->log($payment, 'refund_failed', [
                    'order_number' => $orderNumber,
                    'amount' => $amount,
                    'error' => $exception->getMessage(),
                ]);

                throw $exception;
            }
        }

        $status = ($providerResult['status'] ?? 'success') === 'pending' ? 'pending' : 'success';

        return DB::transaction(function () use (
            $payment,
            $amount,
            $reason,
            $type,
            $meta,
            $refundKey,
            $providerResult,
            $status,
        ) {
            $lockedPayment = Payment::query()->whereKey($payment->id)->lockForUpdate()->firstOrFail();
            $order = Order::query()->whereKey($lockedPayment->order_id)->lockForUpdate()->first();

            $existing = Refund::query()->where('refund_key', $refundKey)->lockForUpdate()->first();

            if ($existing && $existing->status === 'success') {
                return $existing;
            }

            $refund = Refund::updateOrCreate(
                ['refund_key' => $refundKey],
                [
                    'payment_id' => $lockedPayment->id,
                    'provider_refund_id' => $providerResult['provider_refund_id'] ?? ($meta['provider_refund_id'] ?? null),
                    'amount' => $amount,
                    'reason' => $reason,
                    'status' => $status,
                    'provider_status' => $providerResult['provider_status'] ?? ($meta['provider_status'] ?? null),
                    'type' => $type,
                    'refunded_at' => $status === 'success' ? now() : null,
                    'bank_confirmed_at' => $meta['bank_confirmed_at'] ?? null,
                    'raw' => $providerResult['raw'] ?? ($meta['raw'] ?? null),
                    'requested_by' => $meta['requested_by'] ?? null,
                ],
            );

            if ($status === 'success') {
                $this->applyRefundToPayment($lockedPayment, $order, $amount);

                $this->log($lockedPayment, 'refunded', [
                    'order_number' => $order?->order_number,
                    'amount' => $amount,
                    'type' => $type,
                ]);
            } else {
                $this->log($lockedPayment, 'refund_pending', [
                    'order_number' => $order?->order_number,
                    'amount' => $amount,
                    'type' => $type,
                ]);
            }

            return $refund;
        });
    }

    /**
     * Complete a refund that was initially asynchronous/pending.
     */
    protected function finalizeRefund(Refund $refund): Refund
    {
        return DB::transaction(function () use ($refund) {
            $lockedRefund = Refund::query()->whereKey($refund->id)->lockForUpdate()->firstOrFail();

            if ($lockedRefund->status === 'success') {
                return $lockedRefund;
            }

            $payment = Payment::query()->whereKey($lockedRefund->payment_id)->lockForUpdate()->firstOrFail();
            $order = Order::query()->whereKey($payment->order_id)->lockForUpdate()->first();

            $lockedRefund->update([
                'status' => 'success',
                'refunded_at' => now(),
                'bank_confirmed_at' => now(),
            ]);

            $this->applyRefundToPayment($payment, $order, (float) $lockedRefund->amount);

            $this->log($payment, 'refunded', [
                'order_number' => $order?->order_number,
                'amount' => (float) $lockedRefund->amount,
                'type' => $lockedRefund->type,
            ]);

            return $lockedRefund;
        });
    }

    protected function applyRefundToPayment(Payment $payment, ?Order $order, float $amount): void
    {
        $refundedTotal = min(
            (float) $payment->amount,
            (float) $payment->refunded_amount + $amount,
        );

        $isFull = $refundedTotal >= (float) $payment->amount - 0.01;

        $payment->update([
            'refunded_amount' => $refundedTotal,
            'status' => $isFull ? 'refunded' : 'partial_refund',
        ]);

        if (! $order) {
            return;
        }

        $order->update([
            'refunded_amount' => $refundedTotal,
            'status' => $isFull ? 'refunded' : 'paid',
        ]);

        if ($isFull) {
            $this->revokeEnrollments($order);
            $this->cancelPayouts($order, 'Order direfund penuh.');
        }
    }

    protected function revokeEnrollments(Order $order): void
    {
        $order->loadMissing('items');

        foreach ($order->items as $item) {
            Enrollment::query()
                ->where('user_id', $order->user_id)
                ->where('course_id', $item->course_id)
                ->get()
                ->each(fn (Enrollment $enrollment) => app(EnrollmentService::class)->revoke($enrollment));
        }
    }

    /**
     * Create the instructor earnings ledger when an order is paid. The actual
     * bank transfer is still executed by an admin; this is the auditable
     * source of truth for how much each instructor is owed.
     */
    protected function recordPayouts(Order $order, Payment $payment): void
    {
        $feePercent = $this->paymentSettings->platformFeePercent();

        foreach ($order->items as $item) {
            $course = $item->course;

            if (! $course || ! $course->creator_id) {
                continue;
            }

            $gross = (float) $item->course_price;
            $fee = round($gross * $feePercent / 100, 2);

            InstructorPayout::query()->firstOrCreate(
                ['order_id' => $order->id, 'course_id' => $course->id],
                [
                    'instructor_id' => $course->creator_id,
                    'payment_id' => $payment->id,
                    'gross_amount' => $gross,
                    'platform_fee' => $fee,
                    'net_amount' => max(0.0, $gross - $fee),
                    'status' => 'pending',
                    'available_at' => now()->addDays($this->paymentSettings->payoutHoldDays()),
                ],
            );
        }
    }

    protected function cancelPayouts(Order $order, string $reason): void
    {
        InstructorPayout::query()
            ->where('order_id', $order->id)
            ->where('status', 'pending')
            ->update([
                'status' => 'cancelled',
                'notes' => $reason,
            ]);
    }

    protected function log(Payment $payment, string $event, array $payload = []): void
    {
        PaymentLog::create([
            'payment_id' => $payment->id,
            'event' => $event,
            'payload' => $payload,
        ]);
    }

    public function generateOrderNumber(): string
    {
        return 'ORD-'.now()->format('Ymd').'-'.strtoupper(Str::random(6));
    }

    protected function isOrderNumberCollision(\Throwable $exception): bool
    {
        if ($exception instanceof \Illuminate\Database\UniqueConstraintViolationException) {
            return str_contains($exception->getMessage(), 'order_number')
                || str_contains($exception->getMessage(), 'orders_order_number_unique');
        }

        if (! $exception instanceof \Illuminate\Database\QueryException) {
            return false;
        }

        $message = $exception->getMessage();

        return str_contains($message, 'orders_order_number_unique')
            || str_contains($message, 'order_number')
            || in_array($exception->getCode(), ['23000', 23000], true);
    }
}
