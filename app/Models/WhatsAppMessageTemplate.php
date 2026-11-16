<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class WhatsAppMessageTemplate extends Model
{
    use SoftDeletes;

    protected $table = 'whatsapp_message_templates';

    protected $fillable = [
        'whatsapp_provider_id',
        'name',
        'language',
        'category',
        'status',
        'components',
    ];

    protected function casts(): array
    {
        return ['components' => 'array'];
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(WhatsAppProvider::class, 'whatsapp_provider_id');
    }
}
