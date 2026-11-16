<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class WhatsAppAccount extends Model
{
    use SoftDeletes;

    protected $table = 'whatsapp_accounts';

    protected $fillable = [
        'whatsapp_provider_id',
        'name',
        'phone_number',
        'external_account_id',
        'status',
        'metadata',
    ];

    protected function casts(): array
    {
        return ['metadata' => 'array'];
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(WhatsAppProvider::class, 'whatsapp_provider_id');
    }
}
