<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppWebhook extends Model
{
    protected $table = 'whatsapp_webhooks';

    protected $fillable = [
        'whatsapp_provider_id',
        'event',
        'provider_event',
        'provider_message_id',
        'status',
        'error',
        'payload',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'processed_at' => 'datetime',
        ];
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(WhatsAppProvider::class, 'whatsapp_provider_id');
    }
}
