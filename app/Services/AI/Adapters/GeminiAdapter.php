<?php

namespace App\Services\AI\Adapters;

use App\Services\AI\DTO\AIRequest;
use App\Services\AI\DTO\AIResponse;
use App\Services\AI\DTO\ConnectionResult;
use App\Services\AI\Exceptions\ProviderException;

class GeminiAdapter extends AbstractAdapter
{
    protected string $defaultBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';

    protected function endpoint(string $path): string
    {
        return $this->config->baseUrl($this->defaultBaseUrl).'/'.ltrim($path, '/');
    }

    protected function headers(): array
    {
        return [
            'x-goog-api-key' => (string) $this->config->credential('api_key', ''),
            'Content-Type' => 'application/json',
        ];
    }

    public function testConnection(): ConnectionResult
    {
        $start = microtime(true);

        try {
            $models = $this->listModels();

            return ConnectionResult::ok(
                'Gemini connection successful. '.count($models).' models detected.',
                (int) ((microtime(true) - $start) * 1000),
                ['models_count' => count($models)],
            );
        } catch (ProviderException $exception) {
            return ConnectionResult::failed($exception->getMessage());
        }
    }

    public function listModels(): array
    {
        $json = $this->request('GET', $this->endpoint('models?pageSize=200'), [], $this->headers())->json();
        $models = $json['models'] ?? [];

        return collect(is_array($models) ? $models : [])
            ->map(function ($model) {
                $rawId = (string) ($model['name'] ?? '');
                $id = str_starts_with($rawId, 'models/') ? substr($rawId, 7) : $rawId;
                if ($id === '') {
                    return null;
                }

                $supports = $model['supportedGenerationMethods'] ?? [];
                $capabilities = \App\Services\AI\CapabilityDetector::detect($id, $this->capabilities());
                if (is_array($supports) && in_array('embedContent', $supports, true)) {
                    $capabilities[] = 'embeddings';
                }

                return [
                    'id' => $id,
                    'name' => (string) ($model['displayName'] ?? $id),
                    'capabilities' => array_values(array_unique($capabilities)),
                    'context_window' => isset($model['inputTokenLimit']) ? (int) $model['inputTokenLimit'] : \App\Services\AI\CapabilityDetector::contextWindow($id),
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
        $payload = $this->payload($request);
        $url = $this->endpoint('models/'.rawurlencode((string) $model).':generateContent');
        $json = $this->request('POST', $url, $payload, $this->headers())->json();

        $parts = $json['candidates'][0]['content']['parts'] ?? [];
        $content = '';
        $toolCalls = [];

        foreach ($parts as $part) {
            if (isset($part['text'])) {
                $content .= (string) $part['text'];
            }

            if (isset($part['functionCall'])) {
                $toolCalls[] = [
                    'id' => 'call_'.uniqid(),
                    'type' => 'function',
                    'function' => [
                        'name' => (string) ($part['functionCall']['name'] ?? ''),
                        'arguments' => json_encode($part['functionCall']['args'] ?? []),
                    ],
                ];
            }
        }

        $usage = $json['usageMetadata'] ?? [];

        return new AIResponse(
            content: $content,
            toolCalls: $toolCalls,
            usage: [
                'input_tokens' => (int) ($usage['promptTokenCount'] ?? 0),
                'output_tokens' => (int) ($usage['candidatesTokenCount'] ?? 0),
                'total_tokens' => (int) ($usage['totalTokenCount'] ?? 0),
                'raw' => $usage,
            ],
            model: $model,
            provider: $this->name(),
            finishReason: $json['candidates'][0]['finishReason'] ?? null,
            raw: $json,
        );
    }

    protected function payload(AIRequest $request): array
    {
        [$system, $contents] = $this->convertMessages($request);

        $payload = [
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => $request->temperature,
                'maxOutputTokens' => $request->maxTokens,
            ],
        ];

        if ($system !== '') {
            $payload['systemInstruction'] = ['parts' => [['text' => $system]]];
        }

        $declarations = collect($request->tools)->map(function ($tool) {
            $function = $tool['function'] ?? $tool;

            return [
                'name' => (string) ($function['name'] ?? ''),
                'description' => (string) ($function['description'] ?? ''),
                'parameters' => $function['parameters'] ?? ['type' => 'object', 'properties' => new \stdClass],
            ];
        })->filter(fn ($tool) => $tool['name'] !== '')->values()->all();

        if ($declarations !== []) {
            $payload['tools'] = [['functionDeclarations' => $declarations]];
        }

        return array_replace($payload, $request->extra);
    }

    protected function convertMessages(AIRequest $request): array
    {
        $systemParts = [];
        if (filled($request->system)) {
            $systemParts[] = (string) $request->system;
        }

        $contents = [];

        foreach ($request->messages as $message) {
            $role = $message['role'] ?? 'user';
            $content = $message['content'] ?? '';

            if ($role === 'system') {
                $systemParts[] = $this->textContent($content);

                continue;
            }

            if ($role === 'tool') {
                $contents[] = [
                    'role' => 'user',
                    'parts' => [[
                        'functionResponse' => [
                            'name' => (string) ($message['name'] ?? 'tool'),
                            'response' => ['result' => $this->textContent($content)],
                        ],
                    ]],
                ];

                continue;
            }

            $parts = $this->convertParts($content);

            if ($role === 'assistant') {
                foreach ($message['tool_calls'] ?? [] as $toolCall) {
                    $function = $toolCall['function'] ?? [];
                    $args = $function['arguments'] ?? '{}';
                    $parts[] = [
                        'functionCall' => [
                            'name' => (string) ($function['name'] ?? ''),
                            'args' => is_array($args) ? $args : (json_decode((string) $args, true) ?: []),
                        ],
                    ];
                }
            }

            if ($parts === []) {
                $parts[] = ['text' => ''];
            }

            $contents[] = [
                'role' => $role === 'assistant' ? 'model' : 'user',
                'parts' => $parts,
            ];
        }

        return [implode("\n\n", $systemParts), $contents];
    }

    protected function convertParts(mixed $content): array
    {
        if (is_string($content)) {
            return [['text' => $content]];
        }

        if (! is_array($content)) {
            return [];
        }

        $parts = [];
        foreach ($content as $part) {
            if (is_string($part)) {
                $parts[] = ['text' => $part];

                continue;
            }

            $type = $part['type'] ?? null;
            if ($type === 'text') {
                $parts[] = ['text' => (string) ($part['text'] ?? '')];
            } elseif ($type === 'image_url') {
                $url = (string) ($part['image_url']['url'] ?? $part['image_url'] ?? '');
                if (str_starts_with($url, 'data:') && preg_match('/^data:([^;]+);base64,(.*)$/s', $url, $matches)) {
                    $parts[] = ['inlineData' => ['mimeType' => $matches[1], 'data' => $matches[2]]];
                } elseif ($url !== '') {
                    $parts[] = ['fileData' => ['mimeType' => 'image/jpeg', 'fileUri' => $url]];
                }
            }
        }

        return $parts;
    }
}
