<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiSetting extends Model
{
    protected $table = 'ai_settings';

    protected $keyType = 'int';

    protected $fillable = [
        'id',
        'enabled',
        'base_url',
        'model',
        'api_key',
        'provider',
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
            'provider' => 'string',
        ];
    }

    public static function current(): self
    {
        return self::query()->firstOrCreate(['id' => 1], [
            'enabled' => false,
            'base_url' => null,
            'model' => null,
            'api_key' => null,
            'provider' => 'nvidia',
        ]);
    }

    public function audits()
    {
        return $this->hasMany(AiSettingAudit::class, 'ai_setting_id');
    }
}
