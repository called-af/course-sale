<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiSettingAudit extends Model
{
    protected $table = 'ai_setting_audits';

    protected $fillable = [
        'ai_setting_id',
        'user_id',
        'ip',
        'changed_fields',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'changed_fields' => 'array',
        ];
    }

    public function setting()
    {
        return $this->belongsTo(AiSetting::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
