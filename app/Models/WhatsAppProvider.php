<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class WhatsAppProvider extends Model
{
    use SoftDeletes;

    protected $table = 'whatsapp_providers';

    protected $fillable = [
        'name',
        'slug',
        'driver',
        'base_url',
        'config',
        'enabled',
        'is_default',
        'timeout',
        'max_retries',
        'status',
        'last_tested_at',
        'last_error',
        'created_by',
    ];

    protected $hidden = ['config'];

    protected function casts(): array
    {
        return [
            'config' => 'array',
            'enabled' => 'boolean',
            'is_default' => 'boolean',
            'timeout' => 'integer',
            'max_retries' => 'integer',
            'last_tested_at' => 'datetime',
        ];
    }

    public function credentials(): HasMany
    {
        return $this->hasMany(WhatsAppProviderCredential::class, 'whatsapp_provider_id');
    }

    public function accounts(): HasMany
    {
        return $this->hasMany(WhatsAppAccount::class, 'whatsapp_provider_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(WhatsAppMessage::class, 'whatsapp_provider_id');
    }

    public function templates(): HasMany
    {
        return $this->hasMany(WhatsAppMessageTemplate::class, 'whatsapp_provider_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(WhatsAppProviderLog::class, 'whatsapp_provider_id');
    }

    public function credential(string $key): ?string
    {
        $credential = $this->relationLoaded('credentials')
            ? $this->credentials->firstWhere('key', $key)
            : $this->credentials()->where('key', $key)->first();

        return $credential?->value;
    }

    public function hasCredential(string $key): bool
    {
        return filled($this->credential($key));
    }

    public function setCredential(string $key, ?string $value): void
    {
        if ($value === null || $value === '') {
            $this->credentials()->where('key', $key)->delete();

            return;
        }

        $this->credentials()->updateOrCreate(['key' => $key], ['value' => $value]);
        $this->unsetRelation('credentials');
    }

    public function configValue(string $key, mixed $default = null): mixed
    {
        return data_get($this->config ?? [], $key, $default);
    }

    public function scopeEnabled($query)
    {
        return $query->where('enabled', true);
    }
}
