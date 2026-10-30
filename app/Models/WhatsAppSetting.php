<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsAppSetting extends Model
{
    protected $table = 'whatsapp_settings';

    protected $keyType = 'int';

    protected $fillable = [
        'id',
        'enabled',
        'provider',
        'base_url',
        'api_key',
        'from_number',
        'sandbox_keyword',
    ];

    protected $hidden = [
        'api_key',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'enabled' => 'boolean',
            'api_key' => 'encrypted',
        ];
    }

    public static function current(): self
    {
        return self::query()->firstOrCreate(['id' => 1], [
            'enabled' => true,
            'provider' => config('services.whatsapp.provider', 'infobip'),
            'base_url' => config('services.whatsapp.infobip.base_url', 'https://55z3yd.api.infobip.com'),
            'api_key' => config('services.whatsapp.infobip.api_key'),
            'from_number' => (string) config('services.whatsapp.infobip.from', '447860088970'),
            'sandbox_keyword' => (string) config('services.whatsapp.infobip.sandbox_keyword', 'ARKADANISAYSSTUFF'),
        ]);
    }

    public function forDisplay(): array
    {
        $apiKey = $this->api_key;
        $lastFour = $apiKey ? substr($apiKey, -4) : '';

        return [
            'enabled' => (bool) $this->enabled,
            'provider' => $this->provider ?: 'infobip',
            'base_url' => $this->base_url,
            'from_number' => $this->from_number,
            'sandbox_keyword' => $this->sandbox_keyword,
            'has_api_key' => ! empty($apiKey),
            'api_key_hint' => $lastFour ? "••••••••{$lastFour}" : null,
            'is_configured' => ! empty($this->base_url) && ! empty($apiKey),
        ];
    }
}
