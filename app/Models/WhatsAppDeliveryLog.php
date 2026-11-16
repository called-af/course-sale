<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppDeliveryLog extends Model
{
    protected $table = 'whatsapp_delivery_logs';

    protected $fillable = [
        'whatsapp_message_id',
        'whatsapp_provider_id',
        'status',
        'provider_status',
        'description',
        'payload',
    ];

    protected function casts(): array
    {
        return ['payload' => 'array'];
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(WhatsAppMessage::class);
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(WhatsAppProvider::class, 'whatsapp_provider_id');
    }
}
