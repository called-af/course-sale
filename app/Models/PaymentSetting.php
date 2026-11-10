<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentSetting extends Model
{
    protected $table = 'payment_settings';

    protected $keyType = 'int';

    protected $fillable = [
        'id',
        'gateway',
        'currency',
        'platform_fee_percent',
        'payout_hold_days',
        'payout_minimum',
        'payout_account_lock_hours',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'gateway' => 'string',
            'currency' => 'string',
            'platform_fee_percent' => 'decimal:2',
            'payout_hold_days' => 'integer',
            'payout_minimum' => 'decimal:2',
            'payout_account_lock_hours' => 'integer',
        ];
    }

    public static function current(): self
    {
        return self::query()->firstOrCreate(['id' => 1], [
            'gateway' => config('services.payment.default', 'midtrans'),
            'currency' => config('services.payment.currency', 'IDR'),
            'platform_fee_percent' => (float) config('services.payment.platform_fee_percent', 20),
            'payout_hold_days' => (int) config('services.payment.payout_hold_days', 7),
            'payout_minimum' => (float) config('services.payment.payout_minimum', 100000),
            'payout_account_lock_hours' => (int) config('services.payment.payout_account_lock_hours', 24),
        ]);
    }

    public function forDisplay(): array
    {
        $setting = self::current();
        $midtransConfigured = filled(config('services.payment.midtrans.server_key'));
        $diagnostics = app(\App\Services\Payment\MidtransPaymentGateway::class)->diagnostics();

        return [
            'gateway' => $setting->gateway,
            'currency' => $setting->currency,
            'platform_fee_percent' => (float) ($setting->platform_fee_percent ?? config('services.payment.platform_fee_percent', 20)),
            'payout_hold_days' => (int) ($setting->payout_hold_days ?? config('services.payment.payout_hold_days', 7)),
            'payout_minimum' => (float) ($setting->payout_minimum ?? config('services.payment.payout_minimum', 100000)),
            'payout_account_lock_hours' => (int) ($setting->payout_account_lock_hours ?? config('services.payment.payout_account_lock_hours', 24)),
            'mode' => config('services.payment.midtrans.is_production') ? 'production' : 'sandbox',
            'configured' => $midtransConfigured,
            'healthy' => $diagnostics['healthy'],
            'diagnostics' => $diagnostics,
            'webhook_url' => url('/payments/midtrans/webhook'),
            'available' => [
                'midtrans' => $midtransConfigured,
            ],
        ];
    }
}
