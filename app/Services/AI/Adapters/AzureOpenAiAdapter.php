<?php

namespace App\Services\AI\Adapters;

use App\Services\AI\DTO\AIRequest;
use App\Services\AI\DTO\AIResponse;
use App\Services\AI\DTO\ConnectionResult;
use App\Services\AI\Exceptions\ProviderException;

class AzureOpenAiAdapter extends OpenAiCompatibleAdapter
{
    protected function endpoint(string $path): string
    {
        $base = rtrim((string) $this->config->baseUrl, '/');
        $apiVersion = (string) $this->config->configValue('api_version', '2024-10-21');

        if (str_contains($base, '/openai/deployments/')) {
            $url = str_contains($base, '/chat/completions') ? $base : $base.'/chat/completions';
        } else {
            if (str_ends_with($base, '/openai')) {
                $base = substr($base, 0, -7);
            }
            $deployment = (string) ($this->config->configValue('deployment') ?: $this->config->defaultModel);
            $url = $base.'/openai/deployments/'.rawurlencode($deployment).'/chat/completions';
        }

        return $url.(str_contains($url, '?') ? '&' : '?').'api-version='.rawurlencode($apiVersion);
    }

    protected function headers(): array
    {
        $headers = ['Content-Type' => 'application/json'];
        $apiKey = (string) $this->config->credential('api_key', '');
        if ($apiKey !== '') {
            $headers['api-key'] = $apiKey;
        }

        return $headers;
    }

    public function listModels(): array
    {
        // Azure exposes deployments through the management API, not the data
        // plane. Manual model registration is the supported path.
        return [];
    }

    public function testConnection(): ConnectionResult
    {
        $start = microtime(true);

        try {
            $this->request('POST', $this->endpoint('chat/completions'), [
                'messages' => [['role' => 'user', 'content' => 'ping']],
                'max_tokens' => 1,
                'stream' => false,
            ], $this->headers());

            return ConnectionResult::ok('Azure OpenAI deployment is reachable.', (int) ((microtime(true) - $start) * 1000));
        } catch (ProviderException $exception) {
            return ConnectionResult::failed($exception->getMessage());
        }
    }

    protected function payload(AIRequest $request, bool $stream): array
    {
        $payload = parent::payload($request, $stream);
        // Azure derives the model from the deployment URL.
        unset($payload['model']);

        return $payload;
    }

    public function generate(AIRequest $request): AIResponse
    {
        return parent::generate($request);
    }
}
