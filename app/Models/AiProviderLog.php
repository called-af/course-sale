<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiProviderLog extends Model
{
    protected $fillable = [
        'ai_provider_id',
        'user_id',
        'action',
        'status',
        'message',
        'context',
        'ip',
    ];

    protected $hidden = ['context'];

    protected function casts(): array
    {
        return [
            'context' => 'array',
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
