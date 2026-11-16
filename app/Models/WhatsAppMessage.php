<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WhatsAppMessage extends Model
{
    protected $table = 'whatsapp_messages';

    protected $fillable = [
        'whatsapp_provider_id',
        'whatsapp_conversation_id',
        'whatsapp_contact_id',
        'direction',
        'type',
        'to',
        'from',
        'body',
        'media_url',
        'template_name',
        'provider_message_id',
        'status',
        'idempotency_key',
        'error_message',
        'payload',
        'sent_at',
        'delivered_at',
        'read_at',
    ];

    protected $hidden = ['payload'];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'sent_at' => 'datetime',
            'delivered_at' => 'datetime',
            'read_at' => 'datetime',
        ];
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(WhatsAppProvider::class, 'whatsapp_provider_id');
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(WhatsAppConversation::class, 'whatsapp_conversation_id');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(WhatsAppContact::class, 'whatsapp_contact_id');
    }

    public function deliveryLogs(): HasMany
    {
        return $this->hasMany(WhatsAppDeliveryLog::class);
    }
}
