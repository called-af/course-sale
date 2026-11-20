<?php

namespace App\Services\AI\Adapters;

use App\Services\AI\AdapterConfig;
use App\Services\AI\Contracts\AIProviderContract;
use App\Services\AI\DTO\AIRequest;
use App\Services\AI\DTO\AIStreamChunk;
use App\Services\AI\Exceptions\ProviderException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

abstract class AbstractAdapter implements AIProviderContract
{
    public function __construct(protected AdapterConfig $config) {}

    public function name(): string
    {
        return $this->config->name;
    }

    public function capabilities(): array
    {
        return $this->config->capabilities;
    }

    public function stream(AIRequest $request): iterable
    {
        // Adapters that do not implement SSE fall back to a single chunk. The
        // caller still receives a consistent AsyncIterable-like contract.
        $response = $this->generate($request->withStream(false));

        yield new AIStreamChunk($response->content, true, [], $response->toolCalls);
    }

    protected function http(): PendingRequest
    {
        return Http::timeout($this->config->timeout)
            ->acceptJson()
            ->asJson();
    }

    protected function request(string $method, string $url, array $payload = [], array $headers = []): Response
    {
        $client = $this->http()->withHeaders($headers);

        try {
            $response = match (strtoupper($method)) {
                'GET' => $client->get($url),
                'DELETE' => $client->delete($url),
                default => $client->post($url, $payload),
            };
        } catch (ConnectionException $exception) {
            throw new ProviderException(
                'Unable to connect to '.$this->name().'.',
                $this->name(),
                null,
                true,
                'connection_error',
                $exception,
            );
        }

        if ($response->failed()) {
            throw ProviderException::fromResponse($this->name(), $response->status(), $response->body(), $this->errorCode($response));
        }

        return $response;
    }

    protected function errorCode(Response $response): ?string
    {
        $json = $response->json();

        return (string) (data_get($json, 'error.code')
            ?? data_get($json, 'error.type')
            ?? data_get($json, 'code')
            ?? $response->status());
    }

    protected function usageFromOpenAi(array $json): array
    {
        $usage = $json['usage'] ?? [];

        $input = (int) ($usage['prompt_tokens'] ?? $usage['input_tokens'] ?? 0);
        $output = (int) ($usage['completion_tokens'] ?? $usage['output_tokens'] ?? 0);

        return [
            'input_tokens' => $input,
            'output_tokens' => $output,
            'total_tokens' => (int) ($usage['total_tokens'] ?? ($input + $output)),
            'raw' => $usage,
        ];
    }

    protected function normalizeToolCalls(array $toolCalls): array
    {
        $normalized = [];

        foreach ($toolCalls as $index => $toolCall) {
            $function = $toolCall['function'] ?? [];
            $arguments = $function['arguments'] ?? '{}';

            if (is_array($arguments)) {
                $arguments = json_encode($arguments);
            }

            $normalized[] = [
                'id' => (string) ($toolCall['id'] ?? 'call_'.uniqid()),
                'type' => 'function',
                'function' => [
                    'name' => (string) ($function['name'] ?? $toolCall['name'] ?? ''),
                    'arguments' => (string) $arguments,
                ],
            ];
        }

        return $normalized;
    }

    protected function textContent(mixed $content): string
    {
        if (is_string($content)) {
            return $content;
        }

        if (! is_array($content)) {
            return '';
        }

        $text = '';
        foreach ($content as $part) {
            if (is_string($part)) {
                $text .= $part;
            } elseif (is_array($part) && isset($part['text'])) {
                $text .= (string) $part['text'];
            }
        }

        return $text;
    }
}
