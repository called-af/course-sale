<?php

namespace App\Services\Payment;

interface PaymentGatewayInterface
{
    /**
     * Create a payment transaction with the provider.
     *
     * @return array{
     *     provider_ref: string,
     *     payment_url: ?string,
     *     expires_at: ?\DateTimeInterface,
     *     raw: array<string, mixed>,
     * }
     */
    public function createTransaction(float $amount, array $meta): array;

    /**
     * Check the status of a transaction with the provider.
     *
     * @return array{status: string, provider_ref: string, raw?: array<string, mixed>}
     */
    public function verify(?string $providerRef): array;

    /**
     * Refund a settled transaction with the provider.
     *
     * @param  array{refund_key?: string, payment_type?: string}  $options
     * @return array{status: string, raw?: array<string, mixed>}
     */
    public function refund(?string $providerRef, float $amount, string $reason, array $options = []): array;

    /**
     * Cancel an unpaid transaction so it can no longer be paid.
     */
    public function cancel(?string $providerRef): array;

    /**
     * Expire an unpaid transaction at the provider.
     */
    public function expire(?string $providerRef): array;
}
