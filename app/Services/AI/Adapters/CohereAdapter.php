<?php

namespace App\Services\AI\Adapters;

use App\Services\AI\DTO\AIRequest;
use App\Services\AI\DTO\AIResponse;
use App\Services\AI\DTO\ConnectionResult;
use App\Services\AI\Exceptions\ProviderException;

class CohereAdapter extends AbstractAdapter
{
    protected string $defaultBaseUrl = 'https://api.cohere.com/v2';

    protected function headers(): array
    {
        return [
            'Authorization' => 'Bearer '.$this->config->credential('api_key', ''),
            'Content-Type' => 'application/json',
        ];
    }

    protected function endpoint(string $path): string
    {
        return $this->config->baseUrl($this->defaultBaseUrl).'/'.ltrim($path, '/');
    }

    protected function modelsEndpoint(): string
    {
        $base = $this->config->baseUrl($this->defaultBaseUrl);
        $base = preg_replace('#/v2$#', '/v1', $base) ?? $base;

        return rtrim($base, '/').'/models?page_size=100';
    }

    public function testConnection(): ConnectionResult
    {
        $start = microtime(true);

        try {
            $models = $this->listModels();

            return ConnectionResult::ok(
                'Koneksi Cohere berhasil. '.count($models).' model terdeteksi.',
                (int) ((microtime(true) - $start) * 1000),
                ['models_count' => count($models)],
            );
        } catch (ProviderException $exception) {
            return ConnectionResult::failed($exception->getMessage());
        }
    }

    public function listModels(): array
    {
        $json = $this->request('GET', $this->modelsEndpoint(), [], $this->headers())->json();
        $models = $json['models'] ?? [];

        return collect(is_array($models) ? $models : [])
            ->map(function ($model) {
                $id = (string) ($model['name'] ?? '');
                if ($id === '') {
                    return null;
                }

                return [
                    'id' => $id,
                    'name' => (string) ($model['name'] ?? $id),
                    'capabilities' => \App\Services\AI\CapabilityDetector::detect($id, $this->capabilities()),
                    'context_window' => isset($model['context_length']) ? (int) $model['context_length'] : \App\Services\AI\CapabilityDetector::contextWindow($id),
                    'metadata' => $model,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    public function generate(AIRequest $request): AIResponse
    {
        $payload = $this->payload($request);
        $json = $this->request('POST', $this->endpoint('chat'), $payload, $this->headers())->json();

        $message = $json['message'] ?? [];
        $content = '';
        foreach ($message['content'] ?? [] as $block) {
            if (is_string($block)) {
                $content .= $block;
            } elseif (isset($block['text'])) {
                $content .= (string) $block['text'];
            }
        }

        $toolCalls = [];
        foreach ($message['tool_calls'] ?? [] as $toolCall) {
            $toolCalls[] = [
                'id' => (string) ($toolCall['id'] ?? 'call_'.uniqid()),
                'type' => 'function',
                'function' => [
                    'name' => (string) data_get($toolCall, 'function.name', ''),
                    'arguments' => json_encode(data_get($toolCall, 'function.arguments', [])),
                ],
            ];
        }

        foreach ($message['content'] ?? [] as $block) {
            if (($block['type'] ?? null) === 'tool_call') {
                $toolCalls[] = [
                    'id' => (string) ($block['id'] ?? 'call_'.uniqid()),
                    'type' => 'function',
                    'function' => [
                        'name' => (string) data_get($block, 'tool_call.name', ''),
                        'arguments' => json_encode(data_get($block, 'tool_call.arguments', [])),
                    ],
                ];
            }
        }

        $billed = $json['usage']['billed_units'] ?? [];
        $tokens = $json['usage']['tokens'] ?? [];
        $input = (int) ($tokens['input_tokens'] ?? $billed['input_tokens'] ?? 0);
        $output = (int) ($tokens['output_tokens'] ?? $billed['output_tokens'] ?? 0);

        return new AIResponse(
            content: $content,
            toolCalls: $toolCalls,
            usage: [
                'input_tokens' => $input,
                'output_tokens' => $output,
                'total_tokens' => $input + $output,
                'raw' => $json['usage'] ?? [],
            ],
            model: $payload['model'],
            provider: $this->name(),
            finishReason: $json['finish_reason'] ?? null,
            raw: $json,
            providerMessageId: $json['id'] ?? null,
        );
    }

    protected function payload(AIRequest $request): array
    {
        $messages = [];

        if (filled($request->system)) {
            $messages[] = ['role' => 'system', 'content' => (string) $request->system];
        }

        foreach ($request->messages as $message) {
            $role = $message['role'] ?? 'user';
            $content = $message['content'] ?? '';

            if ($role === 'tool') {
                $messages[] = [
                    'role' => 'tool',
                    'tool_call_id' => (string) ($message['tool_call_id'] ?? ''),
                    'content' => $this->textContent($content),
                ];

                continue;
            }

            $entry = ['role' => $role === 'assistant' ? 'assistant' : 'user', 'content' => $this->textContent($content)];

            if ($role === 'assistant' && isset($message['tool_calls'])) {
                $entry['tool_calls'] = collect($message['tool_calls'])->map(function ($toolCall) {
                    return [
                        'id' => (string) ($toolCall['id'] ?? 'call_'.uniqid()),
                        'type' => 'function',
                        'function' => [
                            'name' => (string) data_get($toolCall, 'function.name', ''),
                            'arguments' => (string) data_get($toolCall, 'function.arguments', '{}'),
                        ],
                    ];
                })->values()->all();
            }

            $messages[] = $entry;
        }

        $payload = [
            'model' => $request->model ?: $this->config->defaultModel,
            'messages' => $messages,
            'temperature' => $request->temperature,
            'max_tokens' => $request->maxTokens,
        ];

        if ($request->tools !== []) {
            $payload['tools'] = collect($request->tools)->map(function ($tool) {
                $function = $tool['function'] ?? $tool;

                return [
                    'type' => 'function',
                    'function' => [
                        'name' => (string) ($function['name'] ?? ''),
                        'description' => (string) ($function['description'] ?? ''),
                        'parameters' => $function['parameters'] ?? ['type' => 'object', 'properties' => new \stdClass],
                    ],
                ];
            })->values()->all();
        }

        return array_replace($payload, $request->extra);
    }
}
