<?php

namespace App\Services\Payment;

use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MidtransPaymentGateway implements PaymentGatewayInterface
{
    /**
     * Midtrans only exposes the refund API for these payment channels.
     *
     * @var array<int, string>
     */
    public const REFUNDABLE_CHANNELS = [
        'credit_card',
        'gopay',
        'shopeepay',
        'dana',
        'ovo',
        'qris',
        'kredivo',
        'akulaku',
    ];

    public function createTransaction(float $amount, array $meta): array
    {
        $this->assertReady();

        $currency = strtoupper((string) ($meta['currency'] ?? 'IDR'));

        if ($currency !== 'IDR') {
            throw new \RuntimeException('Midtrans hanya mendukung mata uang IDR.');
        }

        $baseUrl = rtrim((string) config('services.payment.midtrans.snap_base_url'), '/');
        $finishUrl = $meta['finish_url'] ?? url('/student/courses');

        $payload = [
            'transaction_details' => [
                'order_id' => (string) ($meta['order_number'] ?? 'ORD-UNKNOWN'),
                'gross_amount' => (int) round($amount),
            ],
            'customer_details' => array_filter([
                'first_name' => $meta['customer_name'] ?? 'Student',
                'email' => $meta['customer_email'] ?? 'student@example.com',
                'phone' => $meta['customer_phone'] ?? null,
            ], fn ($value) => $value !== null && $value !== ''),
            'callbacks' => array_filter([
                'finish' => $finishUrl,
                'unfinish' => $meta['unfinish_url'] ?? $finishUrl,
                'error' => $meta['error_url'] ?? $finishUrl,
            ]),
            'expiry' => [
                'unit' => 'hours',
                'duration' => (int) ($meta['expiry_hours'] ?? 24),
            ],
        ];

        if (! empty($meta['item_name'])) {
            $payload['item_details'] = [[
                'id' => (string) ($meta['course_id'] ?? $meta['order_number'] ?? 'COURSE'),
                'price' => (int) round($amount),
                'quantity' => 1,
                'name' => mb_substr((string) $meta['item_name'], 0, 50),
            ]];
        }

        if (! empty($meta['course_id'])) {
            $payload['custom_field1'] = (string) $meta['course_id'];
        }

        $response = Http::timeout($this->timeout())
            ->acceptJson()
            ->withBasicAuth($this->serverKey(), '')
            ->post($baseUrl.'/snap/v1/transactions', $payload);

        $json = (array) $response->json();

        if (! $response->successful()) {
            Log::error('Midtrans Snap transaction creation failed.', [
                'http_status' => $response->status(),
                'status_code' => $json['status_code'] ?? null,
                'status_message' => $json['status_message'] ?? null,
                'order_id' => $payload['transaction_details']['order_id'],
            ]);

            throw new \RuntimeException('Midtrans request failed with status '.$response->status().': '.$response->body());
        }

        if (empty($json['token']) || empty($json['redirect_url'])) {
            throw new \RuntimeException('Invalid response from Midtrans.');
        }

        return [
            'provider_ref' => (string) $json['token'],
            'payment_url' => (string) $json['redirect_url'],
            'expires_at' => now()->addHours((int) ($meta['expiry_hours'] ?? 24)),
            'raw' => $json,
        ];
    }

    public function verify(?string $providerRef): array
    {
        if ($providerRef === null || $providerRef === '') {
            return ['status' => 'pending', 'provider_ref' => ''];
        }

        $this->assertReady();

        $baseUrl = rtrim((string) config('services.payment.midtrans.api_base_url'), '/');

        // `providerRef` is the Midtrans order id (our order number).
        $response = Http::timeout($this->timeout())
            ->acceptJson()
            ->withBasicAuth($this->serverKey(), '')
            ->get($baseUrl.'/v2/'.rawurlencode($providerRef).'/status');

        if ($response->status() === 404) {
            return ['status' => 'not_found', 'provider_ref' => (string) $providerRef, 'raw' => []];
        }

        // A 401/5xx must not be treated as "pending": configuration or
        // gateway outages need to be visible instead of silently swallowed.
        if (! $response->successful()) {
            throw new \RuntimeException(
                'Midtrans status check failed with status '.$response->status().': '.$response->body()
            );
        }

        $payload = (array) $response->json();
        $transactionStatus = (string) ($payload['transaction_status'] ?? 'pending');
        $fraudStatus = (string) ($payload['fraud_status'] ?? '');

        return [
            'status' => $this->mapStatus($transactionStatus, $fraudStatus),
            'provider_ref' => (string) $providerRef,
            'transaction' => $this->transactionFields($payload),
            'raw' => $payload,
        ];
    }

    public function refund(?string $providerRef, float $amount, string $reason, array $options = []): array
    {
        if ($providerRef === null || $providerRef === '') {
            throw new \RuntimeException('Midtrans order id is missing for refund.');
        }

        $paymentType = strtolower((string) ($options['payment_type'] ?? ''));

        if ($paymentType !== '' && ! in_array($paymentType, self::REFUNDABLE_CHANNELS, true)) {
            throw new \RuntimeException(
                'Midtrans does not support the refund API for channel '.$paymentType.'. Process the refund manually through the Midtrans dashboard.'
            );
        }

        if ($amount <= 0) {
            throw new \RuntimeException('Refund amount must be greater than zero.');
        }

        $this->assertReady();

        $baseUrl = rtrim((string) config('services.payment.midtrans.api_base_url'), '/');
        $refundKey = (string) ($options['refund_key'] ?? '');

        if ($refundKey === '') {
            $refundKey = 'REF-'.strtoupper(substr(hash('sha256', $providerRef.'|'.(int) round($amount)), 0, 30));
        }

        $response = Http::timeout($this->timeout())
            ->acceptJson()
            ->withBasicAuth($this->serverKey(), '')
            ->post($baseUrl.'/v2/'.rawurlencode($providerRef).'/refund', [
                'refund_key' => $refundKey,
                'amount' => (int) round($amount),
                'reason' => mb_substr($reason !== '' ? $reason : 'Refund', 0, 255),
            ]);

        $json = (array) $response->json();
        $bodyStatusCode = (string) ($json['status_code'] ?? '');

        // Midtrans may answer HTTP 200 with an error status_code (412, 414,
        // 406, ...) when a refund is rejected. Never treat that as success.
        if (! $response->successful() || ($bodyStatusCode !== '' && ! str_starts_with($bodyStatusCode, '2'))) {
            Log::error('Midtrans refund rejected.', [
                'order_id' => $providerRef,
                'http_status' => $response->status(),
                'status_code' => $bodyStatusCode,
                'status_message' => $json['status_message'] ?? null,
                'refund_key' => $refundKey,
            ]);

            throw new \RuntimeException(
                'Midtrans refund failed (HTTP '.$response->status().', status_code '.($bodyStatusCode ?: '-').'): '
                .($json['status_message'] ?? $response->body())
            );
        }

        $providerStatus = strtolower((string) ($json['transaction_status'] ?? $json['refund_status'] ?? 'refund'));
        $normalizedStatus = in_array($providerStatus, ['pending', 'processing', 'authorize'], true)
            ? 'pending'
            : 'success';

        return [
            'status' => $normalizedStatus,
            'provider_status' => $providerStatus,
            'provider_refund_id' => $json['refund_id'] ?? $json['refund_key'] ?? $refundKey,
            'refund_key' => $refundKey,
            'raw' => $json,
        ];
    }

    /**
     * Cancel an unpaid transaction so an old Snap page can no longer be paid.
     */
    public function cancel(?string $providerRef): array
    {
        return $this->postTransactionAction($providerRef, 'cancel');
    }

    /**
     * Expire an unpaid transaction at Midtrans.
     */
    public function expire(?string $providerRef): array
    {
        return $this->postTransactionAction($providerRef, 'expire');
    }

    protected function postTransactionAction(?string $providerRef, string $action): array
    {
        if ($providerRef === null || $providerRef === '') {
            return ['status' => 'skipped'];
        }

        $this->assertReady();

        $baseUrl = rtrim((string) config('services.payment.midtrans.api_base_url'), '/');

        try {
            $response = Http::timeout($this->timeout())
                ->acceptJson()
                ->withBasicAuth($this->serverKey(), '')
                ->post($baseUrl.'/v2/'.rawurlencode($providerRef).'/'.$action);

            $json = (array) $response->json();
            $bodyStatusCode = (string) ($json['status_code'] ?? '');

            if (! $response->successful() || ($bodyStatusCode !== '' && ! str_starts_with($bodyStatusCode, '2'))) {
                Log::info('Midtrans transaction action was not accepted.', [
                    'action' => $action,
                    'order_id' => $providerRef,
                    'http_status' => $response->status(),
                    'status_code' => $bodyStatusCode,
                    'status_message' => $json['status_message'] ?? null,
                ]);

                return ['status' => 'failed', 'raw' => $json];
            }

            return [
                'status' => 'success',
                'provider_status' => strtolower((string) ($json['transaction_status'] ?? $action)),
                'raw' => $json,
            ];
        } catch (\Throwable $exception) {
            // Releasing an order locally must not fail because Midtrans is
            // temporarily unreachable; the webhook/expiry job remains the
            // source of truth.
            report($exception);

            return ['status' => 'error'];
        }
    }

    public function mapStatus(string $transactionStatus, string $fraudStatus = ''): string
    {
        $transactionStatus = strtolower(trim($transactionStatus));
        $fraudStatus = strtolower(trim($fraudStatus));

        return match (true) {
            $transactionStatus === 'settlement' => 'paid',
            $transactionStatus === 'capture' => match ($fraudStatus) {
                'accept' => 'paid',
                'challenge' => 'challenge',
                default => 'failed',
            },
            $transactionStatus === 'pending', $transactionStatus === 'authorize' => 'pending',
            $transactionStatus === 'expire' => 'expired',
            in_array($transactionStatus, ['deny', 'cancel', 'failure'], true) => 'failed',
            $transactionStatus === 'refund' => 'refunded',
            $transactionStatus === 'partial_refund' => 'partial_refund',
            in_array($transactionStatus, ['chargeback', 'partial_chargeback'], true) => 'chargeback',
            default => 'pending',
        };
    }

    /**
     * Normalize the transaction payload into payment columns.
     *
     * @return array<string, mixed>
     */
    public function transactionFields(array $payload): array
    {
        $transactionStatus = strtolower((string) ($payload['transaction_status'] ?? ''));

        return array_filter([
            'transaction_id' => $payload['transaction_id'] ?? null,
            'payment_type' => filled($payload['payment_type'] ?? null)
                ? strtolower((string) $payload['payment_type'])
                : null,
            'fraud_status' => filled($payload['fraud_status'] ?? null)
                ? strtolower((string) $payload['fraud_status'])
                : null,
            'status_code' => filled($payload['status_code'] ?? null)
                ? (string) $payload['status_code']
                : null,
            'midtrans_status' => $transactionStatus !== '' ? $transactionStatus : null,
            'settlement_time' => $this->parseTime($payload['settlement_time'] ?? null),
            'expiry_time' => $this->parseTime($payload['expiry_time'] ?? null),
            'raw_response' => $payload,
        ], fn ($value) => $value !== null);
    }

    /**
     * Configuration diagnostics used by the admin payment settings screen.
     *
     * @return array<string, mixed>
     */
    public function diagnostics(): array
    {
        $serverKey = trim((string) config('services.payment.midtrans.server_key'));
        $isProduction = (bool) config('services.payment.midtrans.is_production');
        $keyLooksSandbox = str_starts_with($serverKey, 'SB-');
        $keyLooksProduction = str_starts_with($serverKey, 'Mid-server-');
        $issues = [];

        if ($serverKey === '') {
            $issues[] = 'MIDTRANS_SERVER_KEY is not set.';
        }

        if ($isProduction && $keyLooksSandbox) {
            $issues[] = 'Production mode is active but the server key is still a sandbox key (SB-).';
        }

        if (! $isProduction && $keyLooksProduction) {
            $issues[] = 'Sandbox mode is active but the server key is a production key.';
        }

        if (app()->isProduction() && ! $isProduction) {
            $issues[] = 'APP_ENV=production but MIDTRANS_IS_PRODUCTION is still false. Transactions will go to sandbox.';
        }

        if ($isProduction && ! $keyLooksProduction && $serverKey !== '') {
            $issues[] = 'MIDTRANS_IS_PRODUCTION=true but the server key is not in production format.';
        }

        return [
            'mode' => $isProduction ? 'production' : 'sandbox',
            'app_env' => app()->environment(),
            'configured' => $serverKey !== '',
            'server_key_kind' => $serverKey === '' ? null : ($keyLooksSandbox ? 'sandbox' : ($keyLooksProduction ? 'production' : 'unknown')),
            'snap_base_url' => config('services.payment.midtrans.snap_base_url'),
            'api_base_url' => config('services.payment.midtrans.api_base_url'),
            'merchant_id_configured' => filled(config('services.payment.midtrans.merchant_id')),
            'client_key_configured' => filled(config('services.payment.midtrans.client_key')),
            'webhook_url' => url('/payments/midtrans/webhook'),
            'currency' => 'IDR',
            'refundable_channels' => self::REFUNDABLE_CHANNELS,
            'healthy' => $issues === [],
            'issues' => $issues,
        ];
    }

    protected function parseTime(mixed $value): ?Carbon
    {
        if (blank($value)) {
            return null;
        }

        try {
            return Carbon::parse((string) $value);
        } catch (\Throwable) {
            return null;
        }
    }

    protected function assertReady(): void
    {
        $serverKey = $this->serverKey();
        $isProduction = (bool) config('services.payment.midtrans.is_production');

        if ($isProduction && str_starts_with($serverKey, 'SB-')) {
            throw new \RuntimeException('Midtrans production mode must not use a sandbox server key (SB-).');
        }

        if (! $isProduction && str_starts_with($serverKey, 'Mid-server-')) {
            throw new \RuntimeException('Midtrans sandbox mode must not use a production server key.');
        }

        if (app()->isProduction() && ! $isProduction) {
            throw new \RuntimeException('MIDTRANS_IS_PRODUCTION must be true when APP_ENV=production.');
        }
    }

    protected function serverKey(): string
    {
        $serverKey = trim((string) config('services.payment.midtrans.server_key'));

        if ($serverKey === '') {
            throw new \RuntimeException('Midtrans server key is not configured.');
        }

        return $serverKey;
    }

    protected function timeout(): int
    {
        return max(5, (int) config('services.payment.midtrans.timeout', 15));
    }
}
