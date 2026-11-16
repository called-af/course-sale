<?php

namespace App\Services\AI\Adapters;

use App\Services\AI\DTO\AIRequest;
use App\Services\AI\DTO\AIResponse;
use App\Services\AI\DTO\ConnectionResult;
use App\Services\AI\Exceptions\ProviderException;

class CloudflareAdapter extends AbstractAdapter
{
    protected string $defaultBaseUrl = 'https://api.cloudflare.com/client/v4';

    protected function headers(): array
    {
        return [
            'Authorization' => 'Bearer '.$this->config->credential('api_key', ''),
            'Content-Type' => 'application/json',
        ];
    }

    protected function accountEndpoint(string $path): string
    {
        $account = (string) $this->config->configValue('account_id', '');

        return $this->config->baseUrl($this->defaultBaseUrl).'/accounts/'.rawurlencode($account).'/'.ltrim($path, '/');
    }

    public function testConnection(): ConnectionResult
    {
        $start = microtime(true);

        try {
            $models = $this->listModels();

            return ConnectionResult::ok(
                'Koneksi Cloudflare Workers AI berhasil. '.count($models).' model terdeteksi.',
                (int) ((microtime(true) - $start) * 1000),
                ['models_count' => count($models)],
            );
        } catch (ProviderException $exception) {
            return ConnectionResult::failed($exception->getMessage());
        }
    }

    public function listModels(): array
    {
        $json = $this->request('GET', $this->accountEndpoint('ai/models/search?per_page=100'), [], $this->headers())->json();
        $models = $json['result'] ?? [];

        return collect(is_array($models) ? $models : [])
            ->map(function ($model) {
                $id = (string) ($model['name'] ?? $model['id'] ?? '');
                if ($id === '') {
                    return null;
                }

                return [
                    'id' => $id,
                    'name' => (string) ($model['name'] ?? $id),
                    'capabilities' => \App\Services\AI\CapabilityDetector::detect($id, $this->capabilities()),
                    'context_window' => \App\Services\AI\CapabilityDetector::contextWindow($id),
                    'metadata' => $model,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    public function generate(AIRequest $request): AIResponse
    {
        $model = $request->model ?: $this->config->defaultModel;
        $payload = [
            'messages' => $request->messages,
            'temperature' => $request->temperature,
            'max_tokens' => $request->maxTokens,
            'stream' => false,
        ];

        if ($request->tools !== []) {
            $payload['tools'] = $request->tools;
        }

        $payload = array_replace($payload, $request->extra);

        $json = $this->request(
            'POST',
            $this->accountEndpoint('ai/run/'.ltrim((string) $model, '/')),
            $payload,
            $this->headers()
        )->json();

        $result = $json['result'] ?? [];
        $content = is_string($result) ? $result : (string) ($result['response'] ?? json_encode($result));
        $usage = $result['usage'] ?? $json['usage'] ?? [];

        return new AIResponse(
            content: $content,
            usage: [
                'input_tokens' => (int) ($usage['prompt_tokens'] ?? $usage['input_tokens'] ?? 0),
                'output_tokens' => (int) ($usage['completion_tokens'] ?? $usage['output_tokens'] ?? 0),
                'total_tokens' => (int) ($usage['total_tokens'] ?? 0),
                'raw' => $usage,
            ],
            model: (string) $model,
            provider: $this->name(),
            raw: $json,
        );
    }
}
