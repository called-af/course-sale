<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Refund extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'payment_id',
        'refund_key',
        'provider_refund_id',
        'amount',
        'reason',
        'status',
        'provider_status',
        'type',
        'refunded_at',
        'bank_confirmed_at',
        'raw',
        'requested_by',
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
            'payment_id' => 'integer',
            'amount' => 'decimal:2',
            'refunded_at' => 'datetime',
            'bank_confirmed_at' => 'datetime',
            'raw' => 'array',
            'requested_by' => 'integer',
        ];
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
