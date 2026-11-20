<?php

namespace App\Services;

use App\Models\AiSetting;

class AiSettings
{
    public function enabled(): bool
    {
        return AiSetting::current()->enabled;
    }

    public function provider(): string
    {
        return (string) (AiSetting::current()->provider ?: 'nvidia');
    }

    public function baseUrl(): ?string
    {
        $configured = AiSetting::current()->base_url;
        $provider = $this->provider();

        if (filled($configured) && $provider === 'openai') {
            return (string) $configured;
        }

        if (filled($configured) && $provider === 'nvidia') {
            return (string) $configured;
        }

        return $this->defaultBaseUrl();
    }

    public function defaultBaseUrl(): ?string
    {
        // Both providers use OpenAI-compatible chat completions endpoints.
        return $this->provider() === 'openai'
            ? (string) config('services.ai.openai.base_url', 'https://api.openai.com/v1')
            : (string) config('services.ai.nvidia.base_url', 'https://integrate.api.nvidia.com/v1');
    }

    public function model(): ?string
    {
        $configured = AiSetting::current()->model;

        if (filled($configured)) {
            return (string) $configured;
        }

        return $this->defaultModel();
    }

    public function defaultModel(): ?string
    {
        return $this->provider() === 'openai'
            ? (string) config('services.ai.openai.model', 'gpt-4o-mini')
            : (string) config('services.ai.nvidia.model', 'nvidia/llama-3.1-nemotron-70b-instruct');
    }

    public function apiKey(): ?string
    {
        return AiSetting::current()->api_key;
    }

    public function hasApiKey(): bool
    {
        return ! empty($this->apiKey());
    }

    public function isConfigured(): bool
    {
        // When providers are managed through the integration dashboard, the
        // legacy single-provider settings are no longer authoritative.
        if (\App\Models\AiProvider::query()->exists()) {
            return app(\App\Services\AI\Manager::class)->defaultProvider() !== null;
        }

        return ! empty($this->baseUrl()) && ! empty($this->model()) && $this->hasApiKey();
    }

    public function setEnabled(bool $enabled): bool
    {
        $setting = AiSetting::current();

        if ($enabled && ! $this->isConfigured()) {
            throw new \RuntimeException('Base URL, model, and API key must be complete before AI is enabled.');
        }

        $setting->enabled = $enabled;
        $setting->save();

        return $setting->enabled;
    }

    public function saveCredentials(array $attributes): void
    {
        $setting = AiSetting::current();
        $previousBaseUrl = $setting->base_url;
        $previousModel = $setting->model;
        $previousApiKey = $setting->api_key;
        $previousProvider = $setting->provider;
        $baseUrlChanged = isset($attributes['base_url']) && $attributes['base_url'] !== $previousBaseUrl;

        if (array_key_exists('provider', $attributes) && $attributes['provider'] !== null) {
            $setting->provider = (string) $attributes['provider'];
        }

        if ($baseUrlChanged && empty($attributes['api_key'] ?? null)) {
            throw new \RuntimeException('The API key must be re-entered when the Base URL changes.');
        }

        if ($baseUrlChanged) {
            $setting->base_url = $attributes['base_url'];
        }

        if (isset($attributes['model'])) {
            $setting->model = $attributes['model'];
        }

        if (! empty($attributes['api_key'] ?? null)) {
            $setting->api_key = $attributes['api_key'];
        }

        $setting->save();

        if ($setting->enabled && (! $setting->base_url || ! $setting->model || ! $setting->api_key)) {
            $setting->base_url = $previousBaseUrl;
            $setting->model = $previousModel;
            $setting->api_key = $previousApiKey;
            $setting->provider = $previousProvider;
            $setting->save();

            throw new \RuntimeException('AI configuration is incomplete.');
        }
    }

    public function forDisplay(): array
    {
        $setting = AiSetting::current();
        $apiKey = $setting->api_key;
        $lastFour = $apiKey ? substr($apiKey, -4) : '';

        return [
            'enabled' => (bool) $setting->enabled,
            'provider' => $setting->provider ?: 'nvidia',
            'base_url' => $this->baseUrl(),
            'model' => $this->model(),
            'has_api_key' => ! empty($apiKey),
            'api_key_hint' => $lastFour ? "••••••••{$lastFour}" : null,
            'is_configured' => $this->isConfigured(),
        ];
    }
}
