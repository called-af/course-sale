<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppProviderLog extends Model
{
    protected $table = 'whatsapp_provider_logs';

    protected $fillable = [
        'whatsapp_provider_id',
        'user_id',
        'action',
        'status',
        'message',
        'context',
        'ip',
    ];

    protected function casts(): array
    {
        return ['context' => 'array'];
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(WhatsAppProvider::class, 'whatsapp_provider_id');
    }
}
