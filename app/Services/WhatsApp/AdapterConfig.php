<?php

namespace App\Services\WhatsApp;

use App\Models\WhatsAppProvider;

class AdapterConfig
{
    public function __construct(
        public readonly ?int $providerId,
        public readonly string $name,
        public readonly string $slug,
        public readonly string $driver,
        public readonly ?string $baseUrl,
        public readonly array $credentials = [],
        public readonly array $config = [],
        public readonly int $timeout = 15,
        public readonly int $maxRetries = 1,
        public readonly array $capabilities = [],
    ) {}

    public static function fromProvider(WhatsAppProvider $provider): self
    {
        $provider->loadMissing('credentials');

        $credentials = $provider->credentials
            ->mapWithKeys(fn ($credential) => [$credential->key => $credential->value])
            ->all();

        $catalog = config('whatsapp_providers.providers', []);
        $preset = $provider->config['preset'] ?? null;
        $capabilities = [];

        if ($preset && isset($catalog[$preset])) {
            $capabilities = $catalog[$preset]['capabilities'] ?? [];
        } else {
            foreach ($catalog as $item) {
                if (($item['driver'] ?? null) === $provider->driver) {
                    $capabilities = array_values(array_unique([...$capabilities, ...($item['capabilities'] ?? [])]));
                }
            }
        }

        return new self(
            providerId: $provider->id,
            name: $provider->name,
            slug: $provider->slug,
            driver: $provider->driver,
            baseUrl: $provider->base_url,
            credentials: $credentials,
            config: $provider->config ?? [],
            timeout: max(1, (int) $provider->timeout),
            maxRetries: max(0, (int) $provider->max_retries),
            capabilities: $capabilities,
        );
    }

    public static function legacy(string $driver, string $name, ?string $baseUrl, array $credentials, array $config = []): self
    {
        return new self(
            providerId: null,
            name: $name,
            slug: 'legacy',
            driver: $driver,
            baseUrl: $baseUrl,
            credentials: $credentials,
            config: $config,
            timeout: 15,
            maxRetries: 0,
            capabilities: ['text'],
        );
    }

    public function credential(string $key, mixed $default = null): mixed
    {
        return $this->credentials[$key] ?? $default;
    }

    public function configValue(string $key, mixed $default = null): mixed
    {
        return data_get($this->config, $key, $default);
    }

    public function baseUrl(string $default = ''): string
    {
        return rtrim($this->baseUrl ?: $default, '/');
    }

    public function supports(string $capability): bool
    {
        return in_array($capability, $this->capabilities, true);
    }
}
