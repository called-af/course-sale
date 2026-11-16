<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AiProvider extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'driver',
        'base_url',
        'config',
        'enabled',
        'is_default',
        'fallback_priority',
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
            'fallback_priority' => 'integer',
            'timeout' => 'integer',
            'max_retries' => 'integer',
            'last_tested_at' => 'datetime',
        ];
    }

    public function credentials(): HasMany
    {
        return $this->hasMany(AiProviderCredential::class, 'ai_provider_id');
    }

    public function models(): HasMany
    {
        return $this->hasMany(AiModel::class, 'ai_provider_id');
    }

    public function usageLogs(): HasMany
    {
        return $this->hasMany(AiUsageLog::class, 'ai_provider_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(AiProviderLog::class, 'ai_provider_id');
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

    public function defaultModel(): ?string
    {
        $model = $this->relationLoaded('models')
            ? $this->models->firstWhere('is_default', true)
            : $this->models()->where('is_default', true)->first();

        if ($model?->model_id) {
            return $model->model_id;
        }

        if (filled($deployment = $this->configValue('deployment'))) {
            return $deployment;
        }

        if (filled($default = $this->configValue('default_model'))) {
            return $default;
        }

        $preset = $this->configValue('preset');
        if (filled($preset)) {
            return config("ai_providers.providers.{$preset}.default_model");
        }

        return null;
    }

    public function scopeEnabled($query)
    {
        return $query->where('enabled', true);
    }
}
