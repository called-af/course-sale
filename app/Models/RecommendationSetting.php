<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecommendationSetting extends Model
{
    protected $table = 'recommendation_settings';

    protected $keyType = 'int';

    protected $fillable = [
        'id',
        'enabled',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'enabled' => 'boolean',
        ];
    }

    public static function current(): self
    {
        return self::query()->firstOrCreate(['id' => 1], [
            'enabled' => true,
        ]);
    }

    public static function isEnabled(): bool
    {
        return self::current()->enabled;
    }
}
