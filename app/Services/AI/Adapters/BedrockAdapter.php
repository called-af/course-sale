<?php

namespace App\Services\AI\Adapters;

use App\Services\AI\DTO\AIRequest;
use App\Services\AI\DTO\AIResponse;
use App\Services\AI\DTO\ConnectionResult;
use App\Services\AI\Exceptions\ProviderException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class BedrockAdapter extends AbstractAdapter
{
    public function testConnection(): ConnectionResult
    {
        $start = microtime(true);

        try {
            $models = $this->listModels();

            return ConnectionResult::ok(
                'Amazon Bedrock connection successful. '.count($models).' models detected.',
                (int) ((microtime(true) - $start) * 1000),
                ['models_count' => count($models)],
            );
        } catch (ProviderException $exception) {
            return ConnectionResult::failed($exception->getMessage());
        }
    }

    public function listModels(): array
    {
        $region = $this->region();
        $url = "https://bedrock.{$region}.amazonaws.com/foundation-models";
        $json = $this->signedRequest('GET', $url, null, 'bedrock');

        return collect($json['modelSummaries'] ?? [])
            ->map(function ($model) {
                $id = (string) ($model['modelId'] ?? '');
                if ($id === '') {
                    return null;
                }

                return [
                    'id' => $id,
                    'name' => (string) ($model['modelName'] ?? $id),
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
        $region = $this->region();
        $pathModel = implode('/', array_map(
            fn ($part) => str_replace('%3A', ':', rawurlencode((string) $part)),
            explode('/', (string) $model)
        ));
        $url = "https://bedrock-runtime.{$region}.amazonaws.com/model/{$pathModel}/converse";

        $json = $this->signedRequest('POST', $url, $this->payload($request), 'bedrock-runtime');

        $content = '';
        $toolCalls = [];

        foreach (data_get($json, 'output.message.content', []) as $block) {
            if (isset($block['text'])) {
                $content .= (string) $block['text'];
            }

            if (isset($block['toolUse'])) {
                $toolCalls[] = [
                    'id' => (string) ($block['toolUse']['toolUseId'] ?? 'call_'.uniqid()),
                    'type' => 'function',
                    'function' => [
                        'name' => (string) ($block['toolUse']['name'] ?? ''),
                        'arguments' => json_encode($block['toolUse']['input'] ?? []),
                    ],
                ];
            }
        }

        $usage = $json['usage'] ?? [];

        return new AIResponse(
            content: $content,
            toolCalls: $toolCalls,
            usage: [
                'input_tokens' => (int) ($usage['inputTokens'] ?? 0),
                'output_tokens' => (int) ($usage['outputTokens'] ?? 0),
                'total_tokens' => (int) ($usage['totalTokens'] ?? 0),
                'raw' => $usage,
            ],
            model: (string) $model,
            provider: $this->name(),
            finishReason: $json['stopReason'] ?? null,
            raw: $json,
        );
    }

    protected function payload(AIRequest $request): array
    {
        $messages = [];
        $system = [];

        if (filled($request->system)) {
            $system[] = ['text' => (string) $request->system];
        }

        foreach ($request->messages as $message) {
            $role = $message['role'] ?? 'user';
            $content = $message['content'] ?? '';

            if ($role === 'system') {
                $system[] = ['text' => $this->textContent($content)];

                continue;
            }

            if ($role === 'tool') {
                $messages[] = [
                    'role' => 'user',
                    'content' => [[
                        'toolResult' => [
                            'toolUseId' => (string) ($message['tool_call_id'] ?? ''),
                            'content' => [['text' => $this->textContent($content)]],
                        ],
                    ]],
                ];

                continue;
            }

            $blocks = [];
            $text = $this->textContent($content);
            if ($text !== '') {
                $blocks[] = ['text' => $text];
            }

            if (is_array($content)) {
                foreach ($content as $part) {
                    if (($part['type'] ?? null) === 'image_url') {
                        $url = (string) ($part['image_url']['url'] ?? $part['image_url'] ?? '');
                        if (str_starts_with($url, 'data:') && preg_match('/^data:image\/([^;]+);base64,(.*)$/s', $url, $matches)) {
                            $blocks[] = ['image' => [
                                'format' => $matches[1] === 'jpg' ? 'jpeg' : $matches[1],
                                'source' => ['bytes' => $matches[2]],
                            ]];
                        }
                    }
                }
            }

            if ($role === 'assistant') {
                foreach ($message['tool_calls'] ?? [] as $toolCall) {
                    $function = $toolCall['function'] ?? [];
                    $args = $function['arguments'] ?? '{}';
                    $blocks[] = ['toolUse' => [
                        'toolUseId' => (string) ($toolCall['id'] ?? 'call_'.uniqid()),
                        'name' => (string) ($function['name'] ?? ''),
                        'input' => is_array($args) ? $args : (json_decode((string) $args, true) ?: []),
                    ]];
                }
            }

            if ($blocks !== []) {
                $messages[] = ['role' => $role === 'assistant' ? 'assistant' : 'user', 'content' => $blocks];
            }
        }

        $payload = [
            'messages' => $messages,
            'inferenceConfig' => [
                'maxTokens' => $request->maxTokens,
                'temperature' => $request->temperature,
            ],
        ];

        if ($system !== []) {
            $payload['system'] = $system;
        }

        if ($request->tools !== []) {
            $payload['toolConfig'] = [
                'tools' => collect($request->tools)->map(function ($tool) {
                    $function = $tool['function'] ?? $tool;

                    return [
                        'toolSpec' => [
                            'name' => (string) ($function['name'] ?? ''),
                            'description' => (string) ($function['description'] ?? ''),
                            'inputSchema' => ['json' => $function['parameters'] ?? ['type' => 'object', 'properties' => new \stdClass]],
                        ],
                    ];
                })->values()->all(),
            ];
        }

        return $payload;
    }

    protected function signedRequest(string $method, string $url, ?array $payload, string $service): array
    {
        $accessKey = (string) $this->config->credential('access_key_id', '');
        $secretKey = (string) $this->config->credential('secret_access_key', '');
        $sessionToken = (string) $this->config->credential('session_token', '');

        if ($accessKey === '' || $secretKey === '') {
            throw ProviderException::configuration($this->name(), 'AWS Access Key and Secret Access Key are required.');
        }

        $body = $payload === null ? '' : json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $parts = parse_url($url);
        $host = $parts['host'] ?? '';
        $canonicalUri = $parts['path'] ?? '/';
        $canonicalQuery = $parts['query'] ?? '';

        $timestamp = gmdate('Ymd\THis\Z');
        $date = gmdate('Ymd');
        $region = $this->region();

        $headers = [
            'content-type' => 'application/json',
            'host' => $host,
            'x-amz-date' => $timestamp,
        ];

        if ($sessionToken !== '') {
            $headers['x-amz-security-token'] = $sessionToken;
        }

        ksort($headers);
        $signedHeaders = implode(';', array_keys($headers));
        $canonicalHeaders = '';
        foreach ($headers as $key => $value) {
            $canonicalHeaders .= $key.':'.trim($value)."\n";
        }

        $payloadHash = hash('sha256', $body);
        $canonicalRequest = implode("\n", [
            strtoupper($method),
            $canonicalUri,
            $canonicalQuery,
            $canonicalHeaders,
            $signedHeaders,
            $payloadHash,
        ]);

        $scope = "{$date}/{$region}/{$service}/aws4_request";
        $stringToSign = implode("\n", [
            'AWS4-HMAC-SHA256',
            $timestamp,
            $scope,
            hash('sha256', $canonicalRequest),
        ]);

        $signingKey = $this->signingKey($secretKey, $date, $region, $service);
        $signature = hash_hmac('sha256', $stringToSign, $signingKey);

        $authorization = 'AWS4-HMAC-SHA256 Credential='.$accessKey.'/'.$scope
            .', SignedHeaders='.$signedHeaders
            .', Signature='.$signature;

        $requestHeaders = [
            'Content-Type' => 'application/json',
            'X-Amz-Date' => $timestamp,
            'Authorization' => $authorization,
        ];
        if ($sessionToken !== '') {
            $requestHeaders['X-Amz-Security-Token'] = $sessionToken;
        }

        try {
            $response = Http::timeout($this->config->timeout)
                ->withHeaders($requestHeaders)
                ->withBody($body, 'application/json')
                ->send(strtoupper($method), $url);
        } catch (ConnectionException $exception) {
            throw new ProviderException('Unable to connect to Amazon Bedrock.', $this->name(), null, true, 'connection_error', $exception);
        }

        if ($response->failed()) {
            throw ProviderException::fromResponse($this->name(), $response->status(), $response->body());
        }

        return $response->json() ?? [];
    }

    protected function signingKey(string $secret, string $date, string $region, string $service): string
    {
        $kDate = hash_hmac('sha256', $date, 'AWS4'.$secret, true);
        $kRegion = hash_hmac('sha256', $region, $kDate, true);
        $kService = hash_hmac('sha256', $service, $kRegion, true);

        return hash_hmac('sha256', 'aws4_request', $kService, true);
    }

    protected function region(): string
    {
        return (string) $this->config->configValue('region', 'us-east-1');
    }
}
