<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PaymentLog;
use App\Services\Payment\MidtransPaymentGateway;
use App\Services\Payment\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService,
        protected MidtransPaymentGateway $gateway,
    ) {}

    public function midtrans(Request $request): JsonResponse
    {
        $serverKey = trim((string) config('services.payment.midtrans.server_key'));

        if ($serverKey === '') {
            return response()->json(['message' => 'Midtrans is not configured.'], 503);
        }

        $payload = $request->all();
        $orderNumber = (string) ($payload['order_id'] ?? '');
        $statusCode = (string) ($payload['status_code'] ?? '');
        $grossAmount = (string) ($payload['gross_amount'] ?? '');
        $signatureKey = (string) ($payload['signature_key'] ?? '');

        if ($orderNumber === '' || $statusCode === '' || $grossAmount === '' || $signatureKey === '') {
            return response()->json(['message' => 'Invalid payload.'], 422);
        }

        $expectedSignature = hash('sha512', $orderNumber.$statusCode.$grossAmount.$serverKey);

        if (! hash_equals($expectedSignature, $signatureKey)) {
            Log::warning('Rejected Midtrans webhook with invalid signature.', ['order_id' => $orderNumber]);

            return response()->json(['message' => 'Invalid signature.'], 403);
        }

        // Never process a notification addressed to another merchant.
        $configuredMerchant = trim((string) config('services.payment.midtrans.merchant_id'));
        $payloadMerchant = trim((string) ($payload['merchant_id'] ?? ''));

        if ($configuredMerchant !== '' && $payloadMerchant !== '' && $configuredMerchant !== $payloadMerchant) {
            Log::warning('Rejected Midtrans webhook for a different merchant.', [
                'order_id' => $orderNumber,
                'merchant_id' => $payloadMerchant,
            ]);

            return response()->json(['message' => 'Merchant mismatch.'], 403);
        }

        $order = Order::query()->where('order_number', $orderNumber)->first();

        if (! $order) {
            // The signature is valid, so this is noise or a notification for a
            // deleted order. Acknowledge it to stop Midtrans retrying forever.
            Log::warning('Midtrans webhook received for an unknown order.', ['order_id' => $orderNumber]);

            return response()->json(['message' => 'OK']);
        }

        // The signature already binds the amount, but verifying it against the
        // local order protects against configuration or data drift.
        if (abs((float) $grossAmount - (float) $order->total_price) > 0.01) {
            Log::warning('Rejected Midtrans webhook with amount mismatch.', [
                'order_id' => $orderNumber,
                'gross_amount' => $grossAmount,
                'order_total' => $order->total_price,
            ]);

            return response()->json(['message' => 'Amount mismatch.'], 422);
        }

        $payment = $order->payments()->latest('id')->first();

        if (! $payment) {
            Log::warning('Midtrans webhook received without a local payment.', ['order_id' => $orderNumber]);

            return response()->json(['message' => 'OK']);
        }

        PaymentLog::create([
            'payment_id' => $payment->id,
            'event' => 'webhook',
            'payload' => $payload,
        ]);

        $transactionStatus = strtolower((string) ($payload['transaction_status'] ?? ''));
        $fraudStatus = strtolower((string) ($payload['fraud_status'] ?? ''));
        $normalized = $this->gateway->mapStatus($transactionStatus, $fraudStatus);
        $transaction = $this->gateway->transactionFields($payload);

        try {
            match ($normalized) {
                'paid' => $this->paymentService->markPaid($payment, $transaction),
                'challenge' => $this->handleChallenge($payment, $transaction),
                'expired' => $this->paymentService->markUnpaid($payment, 'expired', $transaction),
                'failed' => $this->paymentService->markUnpaid($payment, 'failed', $transaction),
                'refunded' => $this->handleRefund($payment, $payload, full: true),
                'partial_refund' => $this->handleRefund($payment, $payload, full: false),
                'chargeback' => $this->paymentService->handleChargeback(
                    $payment,
                    $this->chargebackAmount($payload, $payment),
                    $payload,
                ),
                default => $this->recordPending($payment, $transaction),
            };
        } catch (\Throwable $exception) {
            report($exception);

            Log::error('Failed to process Midtrans webhook.', [
                'order_id' => $orderNumber,
                'transaction_status' => $transactionStatus,
                'error' => $exception->getMessage(),
            ]);

            // A 500 asks Midtrans to retry the notification.
            return response()->json(['message' => 'Webhook processing failed.'], 500);
        }

        return response()->json(['message' => 'OK']);
    }

    /**
     * @param  array<string, mixed>  $transaction
     */
    protected function handleChallenge(\App\Models\Payment $payment, array $transaction): void
    {
        if ($transaction !== []) {
            $payment->forceFill($transaction)->save();
        }

        Log::info('Midtrans payment requires fraud review.', [
            'order_id' => $payment->order?->order_number,
        ]);
    }

    /**
     * @param  array<string, mixed>  $transaction
     */
    protected function recordPending(\App\Models\Payment $payment, array $transaction): void
    {
        if ($transaction !== []) {
            $payment->forceFill($transaction)->save();
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function handleRefund(\App\Models\Payment $payment, array $payload, bool $full): void
    {
        $amount = $this->refundAmount($payload, $payment, $full);

        if ($amount <= 0) {
            Log::warning('Midtrans refund notification without a usable amount.', [
                'order_id' => $payment->order?->order_number,
                'payload' => $payload,
            ]);

            return;
        }

        $this->paymentService->refund(
            $payment,
            (string) ($payload['reason'] ?? 'Midtrans refund'),
            callProvider: false,
            amount: $amount,
            type: 'automatic',
            meta: [
                'refund_key' => $payload['refund_key'] ?? null,
                'provider_refund_id' => $payload['refund_id'] ?? null,
                'provider_status' => 'success',
                'raw' => $payload,
                'bank_confirmed_at' => filled($payload['bank_confirmed_at'] ?? null) ? now() : null,
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function refundAmount(array $payload, \App\Models\Payment $payment, bool $full): float
    {
        if (filled($payload['refund_amount'] ?? null)) {
            return (float) $payload['refund_amount'];
        }

        $refunds = $payload['refunds'] ?? [];

        if (is_array($refunds) && $refunds !== []) {
            $last = end($refunds);

            if (is_array($last) && filled($last['refund_amount'] ?? null)) {
                return (float) $last['refund_amount'];
            }
        }

        return $full ? $payment->refundableAmount() : 0.0;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function chargebackAmount(array $payload, \App\Models\Payment $payment): float
    {
        if (filled($payload['chargeback_amount'] ?? null)) {
            return (float) $payload['chargeback_amount'];
        }

        if (filled($payload['refund_amount'] ?? null)) {
            return (float) $payload['refund_amount'];
        }

        return (float) $payment->amount;
    }
}
