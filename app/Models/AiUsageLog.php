<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiUsageLog extends Model
{
    protected $fillable = [
        'ai_provider_id',
        'user_id',
        'model',
        'request_type',
        'input_tokens',
        'output_tokens',
        'total_tokens',
        'latency_ms',
        'success',
        'error_code',
        'metadata',
    ];

    protected $hidden = ['metadata'];

    protected function casts(): array
    {
        return [
            'input_tokens' => 'integer',
            'output_tokens' => 'integer',
            'total_tokens' => 'integer',
            'latency_ms' => 'integer',
            'success' => 'boolean',
            'metadata' => 'array',
        ];
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(AiProvider::class, 'ai_provider_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
