<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AiConversation extends Model
{
    use SoftDeletes;

    protected $fillable = ['user_id', 'ai_provider_id', 'model', 'title', 'context'];

    protected function casts(): array
    {
        return ['context' => 'array'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(AiProvider::class, 'ai_provider_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(AiMessage::class);
    }
}
