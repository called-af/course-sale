<?php

namespace App\Services\AI;

use App\Services\AI\Adapters\AnthropicAdapter;
use App\Services\AI\Adapters\AzureOpenAiAdapter;
use App\Services\AI\Adapters\BedrockAdapter;
use App\Services\AI\Adapters\CloudflareAdapter;
use App\Services\AI\Adapters\CohereAdapter;
use App\Services\AI\Adapters\GeminiAdapter;
use App\Services\AI\Adapters\OpenAiCompatibleAdapter;
use App\Services\AI\Adapters\ReplicateAdapter;
use App\Services\AI\Contracts\AIProviderContract;
use InvalidArgumentException;

class Registry
{
    /** @var array<string, class-string<AIProviderContract>> */
    protected array $adapters = [
        'openai' => OpenAiCompatibleAdapter::class,
        'openai_compatible' => OpenAiCompatibleAdapter::class,
        'azure_openai' => AzureOpenAiAdapter::class,
        'anthropic' => AnthropicAdapter::class,
        'gemini' => GeminiAdapter::class,
        'cohere' => CohereAdapter::class,
        'bedrock' => BedrockAdapter::class,
        'replicate' => ReplicateAdapter::class,
        'cloudflare' => CloudflareAdapter::class,
    ];

    public function register(string $driver, string $adapterClass): void
    {
        if (! is_a($adapterClass, AIProviderContract::class, true)) {
            throw new InvalidArgumentException("Adapter {$adapterClass} must implement AIProviderContract.");
        }

        $this->adapters[$driver] = $adapterClass;
    }

    public function make(AdapterConfig $config): AIProviderContract
    {
        $class = $this->adapters[$config->driver] ?? null;

        if ($class === null) {
            throw new InvalidArgumentException("Unknown AI driver: {$config->driver}.");
        }

        return app($class, ['config' => $config]);
    }

    public function drivers(): array
    {
        return array_keys($this->adapters);
    }
}
