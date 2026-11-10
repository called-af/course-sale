<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayoutAccountAudit extends Model
{
    protected $fillable = [
        'user_id',
        'changed_fields',
        'old_values',
        'new_values',
        'ip',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'changed_fields' => 'array',
            'old_values' => 'array',
            'new_values' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withTrashed();
    }
}
