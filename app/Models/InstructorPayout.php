<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstructorPayout extends Model
{
    use HasFactory;

    protected $fillable = [
        'instructor_id',
        'order_id',
        'payment_id',
        'course_id',
        'gross_amount',
        'platform_fee',
        'net_amount',
        'status',
        'available_at',
        'reference',
        'notes',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'instructor_id' => 'integer',
            'order_id' => 'integer',
            'payment_id' => 'integer',
            'course_id' => 'integer',
            'gross_amount' => 'decimal:2',
            'platform_fee' => 'decimal:2',
            'net_amount' => 'decimal:2',
            'available_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    /**
     * Pending ledgers whose hold period has elapsed and can be paid out.
     */
    public function scopeAvailable($query)
    {
        return $query
            ->where('status', 'pending')
            ->where(function ($query): void {
                $query->whereNull('available_at')
                    ->orWhere('available_at', '<=', now());
            });
    }

    public function isAvailable(): bool
    {
        return $this->status === 'pending'
            && ($this->available_at === null || $this->available_at->isPast());
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id')->withTrashed();
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
