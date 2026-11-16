<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiMessage extends Model
{
    protected $fillable = [
        'ai_conversation_id',
        'role',
        'content',
        'tool_calls',
        'attachments',
        'provider_message_id',
        'usage',
    ];

    protected function casts(): array
    {
        return [
            'tool_calls' => 'array',
            'attachments' => 'array',
            'usage' => 'array',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(AiConversation::class, 'ai_conversation_id');
    }
}
