<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'order_id',
        'provider_id',
        'reference',
        'transaction_id',
        'payment_type',
        'fraud_status',
        'status_code',
        'midtrans_status',
        'amount',
        'currency',
        'status',
        'payment_url',
        'paid_at',
        'settlement_time',
        'expiry_time',
        'refunded_amount',
        'chargeback_amount',
        'raw_response',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'order_id' => 'integer',
            'provider_id' => 'integer',
            'amount' => 'decimal:2',
            'refunded_amount' => 'decimal:2',
            'chargeback_amount' => 'decimal:2',
            'paid_at' => 'datetime',
            'settlement_time' => 'datetime',
            'expiry_time' => 'datetime',
            'raw_response' => 'array',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(PaymentProvider::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }

    /**
     * Midtrans only exposes the refund API for these payment channels.
     * VA, convenience store and e-channel payments must be refunded manually.
     */
    public function supportsApiRefund(): bool
    {
        $type = strtolower((string) $this->payment_type);

        if ($type === '') {
            // Older rows have no stored channel. Allow the attempt so admins
            // can still refund transactions created before this field existed.
            return true;
        }

        return in_array($type, [
            'credit_card',
            'gopay',
            'shopeepay',
            'dana',
            'ovo',
            'qris',
            'kredivo',
            'akulaku',
        ], true);
    }

    public function refundableAmount(): float
    {
        return max(0.0, (float) $this->amount - (float) $this->refunded_amount - (float) $this->chargeback_amount);
    }
}
