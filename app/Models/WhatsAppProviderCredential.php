<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppProviderCredential extends Model
{
    protected $table = 'whatsapp_provider_credentials';

    protected $fillable = ['whatsapp_provider_id', 'key', 'value'];

    protected $hidden = ['value'];

    protected function casts(): array
    {
        return ['value' => 'encrypted'];
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(WhatsAppProvider::class, 'whatsapp_provider_id');
    }
}
