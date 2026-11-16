<?php

namespace App\Services\AI;

use App\Models\AiProvider;

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
        public readonly int $timeout = 30,
        public readonly int $maxRetries = 1,
        public readonly ?string $defaultModel = null,
        public readonly array $capabilities = [],
    ) {}

    public static function fromProvider(AiProvider $provider): self
    {
        $provider->loadMissing('credentials', 'models');

        $credentials = $provider->credentials
            ->mapWithKeys(fn ($credential) => [$credential->key => $credential->value])
            ->all();

        $catalog = config('ai_providers.providers', []);

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
            defaultModel: $provider->defaultModel(),
            capabilities: self::catalogCapability($catalog, $provider->driver, $provider->config['preset'] ?? null),
        );
    }

    public static function legacy(string $driver, string $name, ?string $baseUrl, string $apiKey, ?string $defaultModel, array $config = []): self
    {
        return new self(
            providerId: null,
            name: $name,
            slug: 'legacy',
            driver: $driver,
            baseUrl: $baseUrl,
            credentials: ['api_key' => $apiKey],
            config: $config,
            timeout: 30,
            maxRetries: 0,
            defaultModel: $defaultModel,
            capabilities: ['text', 'streaming', 'tools'],
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
        $url = $this->baseUrl ?: $default;

        return rtrim($url, '/');
    }

    private static function catalogCapability(array $catalog, string $driver, ?string $preset): array
    {
        if ($preset && isset($catalog[$preset])) {
            return $catalog[$preset]['capabilities'] ?? [];
        }

        // Union the capabilities of every preset that shares the driver so a
        // provider is never under-reported when its preset is unknown.
        $capabilities = [];

        foreach ($catalog as $item) {
            if (($item['driver'] ?? null) === $driver) {
                $capabilities = array_values(array_unique([...$capabilities, ...($item['capabilities'] ?? [])]));
            }
        }

        return $capabilities ?: ['text', 'streaming', 'tools'];
    }
}
