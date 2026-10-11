<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppearanceSetting extends Model
{
    public const PALETTES = [
        'purple', 'indigo', 'blue', 'teal', 'emerald',
        'cyan', 'rose', 'pink', 'orange', 'amber',
    ];

    protected $table = 'appearance_settings';

    protected $keyType = 'int';

    protected $fillable = [
        'id',
        'palette',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
        ];
    }

    public static function current(): self
    {
        return self::query()->firstOrCreate(['id' => 1], [
            'palette' => 'purple',
        ]);
    }
}