<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiProviderCredential extends Model
{
    protected $fillable = ['ai_provider_id', 'key', 'value'];

    protected $hidden = ['value'];

    protected function casts(): array
    {
        return [
            'value' => 'encrypted',
        ];
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(AiProvider::class, 'ai_provider_id');
    }
}
