<?php

namespace App\Services\AI\Adapters;

use App\Services\AI\DTO\AIRequest;
use App\Services\AI\DTO\AIResponse;
use App\Services\AI\DTO\AIStreamChunk;
use App\Services\AI\DTO\ConnectionResult;
use App\Services\AI\Exceptions\ProviderException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class OpenAiCompatibleAdapter extends AbstractAdapter
{
    protected string $defaultBaseUrl = 'https://api.openai.com/v1';

    protected function endpoint(string $path): string
    {
        return $this->config->baseUrl($this->defaultBaseUrl).'/'.ltrim($path, '/');
    }

    protected function headers(): array
    {
        $headers = [
            'Content-Type' => 'application/json',
        ];

        $apiKey = (string) $this->config->credential('api_key', '');
        if ($apiKey !== '') {
            $headers['Authorization'] = 'Bearer '.$apiKey;
        }

        $organization = $this->config->configValue('organization');
        if (filled($organization)) {
            $headers['OpenAI-Organization'] = (string) $organization;
        }

        $project = $this->config->configValue('project');
        if (filled($project)) {
            $headers['OpenAI-Project'] = (string) $project;
        }

        if (filled($this->config->configValue('site_url'))) {
            $headers['HTTP-Referer'] = (string) $this->config->configValue('site_url');
        }

        if (filled($this->config->configValue('site_name'))) {
            $headers['X-Title'] = (string) $this->config->configValue('site_name');
        }

        $custom = $this->config->configValue('headers', []);
        if (is_string($custom)) {
            $custom = json_decode($custom, true) ?: [];
        }

        if (is_array($custom)) {
            foreach ($custom as $key => $value) {
                if (is_string($key) && is_scalar($value)) {
                    $headers[$key] = (string) $value;
                }
            }
        }

        return $headers;
    }

    public function testConnection(): ConnectionResult
    {
        $start = microtime(true);

        try {
            $models = $this->listModels();
            $latency = (int) ((microtime(true) - $start) * 1000);

            return ConnectionResult::ok(
                $models === []
                    ? 'Endpoint is reachable. Models are not yet available for detection.'
                    : 'Connection successful. '.count($models).' models detected.',
                $latency,
                ['models_count' => count($models)],
            );
        } catch (ProviderException $exception) {
            // Some compatible servers do not expose /models. Fall back to a
            // minimal chat completion so the credential check is still real.
            if (in_array($exception->statusCode, [404, 405, 501], true) || $exception->errorCode === 'connection_error') {
                try {
                    $this->ping();
                    $latency = (int) ((microtime(true) - $start) * 1000);

                    return ConnectionResult::ok('Connection successful (model listing unavailable).', $latency);
                } catch (ProviderException $pingException) {
                    return ConnectionResult::failed($pingException->getMessage());
                }
            }

            return ConnectionResult::failed($exception->getMessage());
        }
    }

    public function listModels(): array
    {
        $response = $this->request('GET', $this->endpoint('models'), [], $this->headers());
        $json = $response->json();
        $data = $json['data'] ?? $json['models'] ?? [];

        if (! is_array($data)) {
            return [];
        }

        $models = [];
        foreach ($data as $model) {
            $id = is_string($model) ? $model : (string) ($model['id'] ?? $model['name'] ?? '');
            if ($id === '') {
                continue;
            }

            $models[] = [
                'id' => $id,
                'name' => (string) ($model['name'] ?? $id),
                'capabilities' => \App\Services\AI\CapabilityDetector::detect($id, $this->capabilities()),
                'context_window' => \App\Services\AI\CapabilityDetector::contextWindow($id),
                'metadata' => is_array($model) ? $model : [],
            ];
        }

        return $models;
    }

    public function generate(AIRequest $request): AIResponse
    {
        $payload = $this->payload($request, false);
        $response = $this->request('POST', $this->endpoint('chat/completions'), $payload, $this->headers());
        $json = $response->json();

        $message = $json['choices'][0]['message'] ?? [];
        $content = $this->textContent($message['content'] ?? '');
        $toolCalls = $this->normalizeToolCalls($message['tool_calls'] ?? []);

        return new AIResponse(
            content: $content,
            toolCalls: $toolCalls,
            usage: $this->usageFromOpenAi($json),
            model: $json['model'] ?? $request->model ?? $this->config->defaultModel,
            provider: $this->name(),
            finishReason: $json['choices'][0]['finish_reason'] ?? null,
            raw: $json,
            providerMessageId: $json['id'] ?? null,
        );
    }

    public function stream(AIRequest $request): iterable
    {
        $payload = $this->payload($request, true);
        $url = $this->endpoint('chat/completions');

        try {
            $response = Http::timeout($this->config->timeout)
                ->withOptions(['stream' => true])
                ->withHeaders($this->headers())
                ->post($url, $payload);
        } catch (ConnectionException $exception) {
            throw new ProviderException('Unable to connect to '.$this->name().'.', $this->name(), null, true, 'connection_error', $exception);
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
                if ($line === '' || ! str_starts_with($line, 'data:')) {
                    continue;
                }

                $data = trim(substr($line, 5));
                if ($data === '[DONE]') {
                    yield new AIStreamChunk('', true);

                    return;
                }

                $decoded = json_decode($data, true);
                if (! is_array($decoded)) {
                    continue;
                }

                $delta = $decoded['choices'][0]['delta'] ?? [];
                $content = $this->textContent($delta['content'] ?? '');
                $toolCalls = $delta['tool_calls'] ?? [];

                if ($content !== '' || $toolCalls !== []) {
                    yield new AIStreamChunk($content, false, $decoded, $this->normalizeToolCalls($toolCalls));
                }
            }
        }

        yield new AIStreamChunk('', true);
    }

    protected function payload(AIRequest $request, bool $stream): array
    {
        $payload = [
            'model' => $request->model ?: $this->config->defaultModel,
            'messages' => $request->messages,
            'temperature' => $request->temperature,
            'max_tokens' => $request->maxTokens,
            'stream' => $stream,
        ];

        if ($stream) {
            $payload['stream_options'] = ['include_usage' => true];
        }

        if ($request->tools !== []) {
            $payload['tools'] = $request->tools;
            $payload['tool_choice'] = 'auto';
        }

        $extra = $this->config->configValue('parameters', []);
        if (is_string($extra)) {
            $extra = json_decode($extra, true) ?: [];
        }

        if (is_array($extra)) {
            $payload = array_replace($payload, $extra);
        }

        $payload = array_replace($payload, $request->extra);

        return $payload;
    }

    protected function ping(): void
    {
        $this->request('POST', $this->endpoint('chat/completions'), [
            'model' => $this->config->defaultModel,
            'messages' => [['role' => 'user', 'content' => 'ping']],
            'max_tokens' => 1,
            'stream' => false,
        ], $this->headers());
    }
}
