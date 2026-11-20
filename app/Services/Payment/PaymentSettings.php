<?php

namespace App\Services\Payment;

use App\Models\PaymentMethod;
use App\Models\PaymentProvider;
use App\Models\PaymentSetting;

class PaymentSettings
{
    public function current(): PaymentSetting
    {
        return PaymentSetting::current();
    }

    public function forDisplay(): array
    {
        $setting = PaymentSetting::current();
        $midtransConfigured = filled(config('services.payment.midtrans.server_key'));
        $diagnostics = app(MidtransPaymentGateway::class)->diagnostics();

        return [
            'gateway' => $setting->gateway,
            'currency' => $setting->currency,
            'platform_fee_percent' => $this->platformFeePercent(),
            'payout_hold_days' => $this->payoutHoldDays(),
            'payout_minimum' => $this->payoutMinimum(),
            'payout_account_lock_hours' => $this->payoutAccountLockHours(),
            'mode' => config('services.payment.midtrans.is_production')
                ? 'production'
                : 'sandbox',
            'configured' => $midtransConfigured,
            'healthy' => $diagnostics['healthy'],
            'diagnostics' => $diagnostics,
            'webhook_url' => url('/payments/midtrans/webhook'),
            'available' => [
                'midtrans' => $midtransConfigured,
            ],
        ];
    }

    /**
     * Platform fee percent currently applied to instructor payouts. The
     * value is stored in the payment settings table so it can be changed from
     * the admin panel without touching the environment config.
     */
    public function platformFeePercent(): float
    {
        $setting = PaymentSetting::current();

        if ($setting->platform_fee_percent !== null) {
            return max(0.0, min(100.0, (float) $setting->platform_fee_percent));
        }

        return max(0.0, min(100.0, (float) config('services.payment.platform_fee_percent', 20)));
    }

    public function updatePlatformFee(float $percent): array
    {
        $percent = round(max(0.0, min(100.0, $percent)), 2);

        PaymentSetting::current()->forceFill(['platform_fee_percent' => $percent])->save();

        return ['platform_fee_percent' => $percent];
    }

    public function payoutHoldDays(): int
    {
        $setting = PaymentSetting::current();
        $value = $setting->payout_hold_days;

        return max(0, min(90, (int) ($value ?? config('services.payment.payout_hold_days', 7))));
    }

    public function payoutMinimum(): float
    {
        $setting = PaymentSetting::current();
        $value = $setting->payout_minimum;

        return max(0.0, (float) ($value ?? config('services.payment.payout_minimum', 100000)));
    }

    public function payoutAccountLockHours(): int
    {
        $setting = PaymentSetting::current();
        $value = $setting->payout_account_lock_hours;

        return max(0, min(168, (int) ($value ?? config('services.payment.payout_account_lock_hours', 24))));
    }

    public function updatePayoutSettings(int $holdDays, float $minimum, int $lockHours): array
    {
        $holdDays = max(0, min(90, $holdDays));
        $minimum = max(0.0, round($minimum, 2));
        $lockHours = max(0, min(168, $lockHours));

        PaymentSetting::current()->forceFill([
            'payout_hold_days' => $holdDays,
            'payout_minimum' => $minimum,
            'payout_account_lock_hours' => $lockHours,
        ])->save();

        return [
            'payout_hold_days' => $holdDays,
            'payout_minimum' => $minimum,
            'payout_account_lock_hours' => $lockHours,
        ];
    }

    public function saveGateway(string $gateway, ?string $currency = null): array
    {
        $setting = PaymentSetting::current();

        // Midtrans is the only supported payment gateway.
        if ($gateway !== 'midtrans') {
            throw new \RuntimeException('The payment gateway must be Midtrans.');
        }

        $currency = strtoupper(trim((string) ($currency ?? $setting->currency)));

        // Snap only supports IDR.
        if ($currency !== 'IDR') {
            throw new \RuntimeException('Midtrans only supports IDR currency.');
        }

        $setting->forceFill([
            'gateway' => $gateway,
            'currency' => $currency,
        ])->save();

        // Keep the provider and its methods in sync with the saved gateway.
        // Without this, choosing Midtrans here could leave the provider
        // inactive and checkout would show "no payment methods".
        $this->syncMidtransProvider();

        return $setting->only(['gateway', 'currency']);
    }

    /**
     * Ensure the Midtrans provider is active and has its default methods.
     */
    protected function syncMidtransProvider(): void
    {
        $provider = PaymentProvider::updateOrCreate(
            ['code' => 'midtrans'],
            ['name' => 'Midtrans', 'is_active' => true],
        );

        $methods = [
            ['Credit Card', 'credit_card'],
            ['QRIS', 'qris'],
            ['Virtual Account', 'virtual_account'],
            ['GoPay', 'gopay'],
        ];

        foreach ($methods as [$name, $code]) {
            PaymentMethod::updateOrCreate(
                ['provider_id' => $provider->id, 'code' => $code],
                ['name' => $name],
            );
        }
    }
}
