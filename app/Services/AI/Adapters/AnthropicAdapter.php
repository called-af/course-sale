<?php

namespace App\Services\AI\Adapters;

use App\Services\AI\DTO\AIRequest;
use App\Services\AI\DTO\AIResponse;
use App\Services\AI\DTO\AIStreamChunk;
use App\Services\AI\DTO\ConnectionResult;
use App\Services\AI\Exceptions\ProviderException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class AnthropicAdapter extends AbstractAdapter
{
    protected string $defaultBaseUrl = 'https://api.anthropic.com/v1';

    protected function headers(): array
    {
        return [
            'x-api-key' => (string) $this->config->credential('api_key', ''),
            'anthropic-version' => (string) $this->config->configValue('api_version', '2023-06-01'),
            'Content-Type' => 'application/json',
        ];
    }

    protected function endpoint(string $path): string
    {
        return $this->config->baseUrl($this->defaultBaseUrl).'/'.ltrim($path, '/');
    }

    public function testConnection(): ConnectionResult
    {
        $start = microtime(true);

        try {
            $models = $this->listModels();

            return ConnectionResult::ok(
                'Koneksi Anthropic berhasil. '.count($models).' model terdeteksi.',
                (int) ((microtime(true) - $start) * 1000),
                ['models_count' => count($models)],
            );
        } catch (ProviderException $exception) {
            if (in_array($exception->statusCode, [404, 405], true)) {
                try {
                    $this->request('POST', $this->endpoint('messages'), [
                        'model' => $this->config->defaultModel,
                        'max_tokens' => 1,
                        'messages' => [['role' => 'user', 'content' => 'ping']],
                    ], $this->headers());

                    return ConnectionResult::ok('Koneksi Anthropic berhasil.', (int) ((microtime(true) - $start) * 1000));
                } catch (ProviderException $pingException) {
                    return ConnectionResult::failed($pingException->getMessage());
                }
            }

            return ConnectionResult::failed($exception->getMessage());
        }
    }

    public function listModels(): array
    {
        $json = $this->request('GET', $this->endpoint('models'), [], $this->headers())->json();
        $data = $json['data'] ?? [];

        return collect(is_array($data) ? $data : [])
            ->map(function ($model) {
                $id = (string) ($model['id'] ?? '');
                if ($id === '') {
                    return null;
                }

                return [
                    'id' => $id,
                    'name' => (string) ($model['display_name'] ?? $id),
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
        $payload = $this->payload($request);
        $json = $this->request('POST', $this->endpoint('messages'), $payload, $this->headers())->json();

        $content = '';
        $toolCalls = [];

        foreach ($json['content'] ?? [] as $block) {
            if (($block['type'] ?? null) === 'text') {
                $content .= (string) ($block['text'] ?? '');
            } elseif (($block['type'] ?? null) === 'tool_use') {
                $toolCalls[] = [
                    'id' => (string) ($block['id'] ?? 'call_'.uniqid()),
                    'type' => 'function',
                    'function' => [
                        'name' => (string) ($block['name'] ?? ''),
                        'arguments' => json_encode($block['input'] ?? []),
                    ],
                ];
            }
        }

        $usage = $json['usage'] ?? [];

        return new AIResponse(
            content: $content,
            toolCalls: $toolCalls,
            usage: [
                'input_tokens' => (int) ($usage['input_tokens'] ?? 0),
                'output_tokens' => (int) ($usage['output_tokens'] ?? 0),
                'total_tokens' => (int) ($usage['input_tokens'] ?? 0) + (int) ($usage['output_tokens'] ?? 0),
                'raw' => $usage,
            ],
            model: $json['model'] ?? $request->model ?? $this->config->defaultModel,
            provider: $this->name(),
            finishReason: $json['stop_reason'] ?? null,
            raw: $json,
            providerMessageId: $json['id'] ?? null,
        );
    }

    public function stream(AIRequest $request): iterable
    {
        $payload = $this->payload($request);
        $payload['stream'] = true;

        try {
            $response = Http::timeout($this->config->timeout)
                ->withOptions(['stream' => true])
                ->withHeaders($this->headers())
                ->post($this->endpoint('messages'), $payload);
        } catch (ConnectionException $exception) {
            throw new ProviderException('Tidak dapat terhubung ke Anthropic.', $this->name(), null, true, 'connection_error', $exception);
        }

        if ($response->failed()) {
            throw ProviderException::fromResponse($this->name(), $response->status(), $response->body());
        }

        $body = $response->toPsrResponse()->getBody();
        $buffer = '';

        while (! $body->eof()) {
            $buffer .= $body->read(4096);
            $lines = preg_split('/\r\n|\r|\n/', $buffer);
            $buffer = array_pop($lines) ?? '';

            foreach ($lines as $line) {
                $line = trim($line);
                if (! str_starts_with($line, 'data:')) {
                    continue;
                }

                $decoded = json_decode(trim(substr($line, 5)), true);
                if (! is_array($decoded)) {
                    continue;
                }

                if (($decoded['type'] ?? null) === 'content_block_delta') {
                    $text = (string) data_get($decoded, 'delta.text', '');
                    if ($text !== '') {
                        yield new AIStreamChunk($text, false, $decoded);
                    }
                }

                if (($decoded['type'] ?? null) === 'message_stop') {
                    yield new AIStreamChunk('', true, $decoded);

                    return;
                }
            }
        }

        yield new AIStreamChunk('', true);
    }

    protected function payload(AIRequest $request): array
    {
        [$system, $messages] = $this->convertMessages($request);

        $payload = [
            'model' => $request->model ?: $this->config->defaultModel,
            'max_tokens' => $request->maxTokens,
            'temperature' => $request->temperature,
            'messages' => $messages,
        ];

        if ($system !== '') {
            $payload['system'] = $system;
        }

        $tools = $this->convertTools($request->tools);
        if ($tools !== []) {
            $payload['tools'] = $tools;
        }

        return array_replace($payload, $request->extra);
    }

    protected function convertMessages(AIRequest $request): array
    {
        $systemParts = [];
        if (filled($request->system)) {
            $systemParts[] = (string) $request->system;
        }

        $messages = [];

        foreach ($request->messages as $message) {
            $role = $message['role'] ?? 'user';
            $content = $message['content'] ?? '';

            if ($role === 'system') {
                $systemParts[] = $this->textContent($content);

                continue;
            }

            if ($role === 'tool') {
                $toolResult = [
                    'type' => 'tool_result',
                    'tool_use_id' => (string) ($message['tool_call_id'] ?? ''),
                    'content' => $this->textContent($content),
                ];

                $last = end($messages);
                if (is_array($last) && ($last['role'] ?? null) === 'user'
                    && isset($last['content'][0]['type'])
                    && $last['content'][0]['type'] === 'tool_result') {
                    $messages[count($messages) - 1]['content'][] = $toolResult;
                } else {
                    $messages[] = ['role' => 'user', 'content' => [$toolResult]];
                }

                continue;
            }

            if ($role === 'assistant') {
                $blocks = [];
                $text = $this->textContent($content);
                if ($text !== '') {
                    $blocks[] = ['type' => 'text', 'text' => $text];
                }

                foreach ($message['tool_calls'] ?? [] as $toolCall) {
                    $function = $toolCall['function'] ?? [];
                    $arguments = $function['arguments'] ?? '{}';
                    $blocks[] = [
                        'type' => 'tool_use',
                        'id' => (string) ($toolCall['id'] ?? 'call_'.uniqid()),
                        'name' => (string) ($function['name'] ?? ''),
                        'input' => is_array($arguments) ? $arguments : (json_decode((string) $arguments, true) ?: []),
                    ];
                }

                if ($blocks !== []) {
                    $messages[] = ['role' => 'assistant', 'content' => $blocks];
                }

                continue;
            }

            $messages[] = ['role' => 'user', 'content' => $this->convertUserContent($content)];
        }

        return [implode("\n\n", $systemParts), $messages];
    }

    protected function convertUserContent(mixed $content): array
    {
        if (is_string($content)) {
            return [['type' => 'text', 'text' => $content]];
        }

        if (! is_array($content)) {
            return [['type' => 'text', 'text' => '']];
        }

        $blocks = [];
        foreach ($content as $part) {
            if (is_string($part)) {
                $blocks[] = ['type' => 'text', 'text' => $part];

                continue;
            }

            $type = $part['type'] ?? null;
            if ($type === 'text') {
                $blocks[] = ['type' => 'text', 'text' => (string) ($part['text'] ?? '')];
            } elseif ($type === 'image_url') {
                $url = $part['image_url']['url'] ?? $part['image_url'] ?? '';
                $block = $this->imageBlock((string) $url);
                if ($block !== null) {
                    $blocks[] = $block;
                }
            }
        }

        return $blocks === [] ? [['type' => 'text', 'text' => '']] : $blocks;
    }

    protected function imageBlock(string $url): ?array
    {
        if (str_starts_with($url, 'data:')) {
            if (preg_match('/^data:([^;]+);base64,(.*)$/s', $url, $matches)) {
                return [
                    'type' => 'image',
                    'source' => [
                        'type' => 'base64',
                        'media_type' => $matches[1],
                        'data' => $matches[2],
                    ],
                ];
            }

            return null;
        }

        if ($url !== '') {
            return ['type' => 'image', 'source' => ['type' => 'url', 'url' => $url]];
        }

        return null;
    }

    protected function convertTools(array $tools): array
    {
        return collect($tools)->map(function ($tool) {
            $function = $tool['function'] ?? $tool;

            return [
                'name' => (string) ($function['name'] ?? ''),
                'description' => (string) ($function['description'] ?? ''),
                'input_schema' => $function['parameters'] ?? ['type' => 'object', 'properties' => new \stdClass],
            ];
        })->filter(fn ($tool) => $tool['name'] !== '')->values()->all();
    }
}
