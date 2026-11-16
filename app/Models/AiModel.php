<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AiModel extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'ai_provider_id',
        'model_id',
        'name',
        'capabilities',
        'context_window',
        'max_output_tokens',
        'is_default',
        'metadata',
        'discovered_at',
    ];

    protected function casts(): array
    {
        return [
            'capabilities' => 'array',
            'metadata' => 'array',
            'context_window' => 'integer',
            'max_output_tokens' => 'integer',
            'is_default' => 'boolean',
            'discovered_at' => 'datetime',
        ];
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(AiProvider::class, 'ai_provider_id');
    }

    public function supports(string $capability): bool
    {
        return in_array($capability, $this->capabilities ?? [], true);
    }
}
