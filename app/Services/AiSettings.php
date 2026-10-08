<?php

namespace App\Services;

use App\Models\AiSetting;

class AiSettings
{
    public function enabled(): bool
    {
        return AiSetting::current()->enabled;
    }

    public function baseUrl(): ?string
    {
        return AiSetting::current()->base_url;
    }

    public function model(): ?string
    {
        return AiSetting::current()->model;
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
        return ! empty($this->baseUrl())
            && ! empty($this->model())
            && $this->hasApiKey();
    }

    public function setEnabled(bool $enabled): bool
    {
        $setting = AiSetting::current();

        if ($enabled && ! $this->isConfigured()) {
            throw new \RuntimeException('Base URL, model, dan API key harus lengkap sebelum AI diaktifkan.');
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
        $baseUrlChanged = isset($attributes['base_url']) && $attributes['base_url'] !== $previousBaseUrl;

        if ($baseUrlChanged && empty($attributes['api_key'] ?? null)) {
            throw new \RuntimeException('API key wajib diisi ulang saat Base URL berubah.');
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
            $setting->save();

            throw new \RuntimeException('Konfigurasi AI tidak lengkap.');
        }
    }

    public function forDisplay(): array
    {
        $setting = AiSetting::current();
        $apiKey = $setting->api_key;
        $lastFour = $apiKey ? substr($apiKey, -4) : '';

        return [
            'enabled' => (bool) $setting->enabled,
            'base_url' => $setting->base_url,
            'model' => $setting->model,
            'has_api_key' => ! empty($apiKey),
            'api_key_hint' => $lastFour ? "••••••••{$lastFour}" : null,
            'is_configured' => $this->isConfigured(),
        ];
    }
}
