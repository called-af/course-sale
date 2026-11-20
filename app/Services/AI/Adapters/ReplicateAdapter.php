<?php

namespace App\Services\AI\Adapters;

use App\Services\AI\DTO\AIRequest;
use App\Services\AI\DTO\AIResponse;
use App\Services\AI\DTO\ConnectionResult;
use App\Services\AI\Exceptions\ProviderException;
use App\Services\AI\Exceptions\UnsupportedCapabilityException;

class ReplicateAdapter extends AbstractAdapter
{
    protected string $defaultBaseUrl = 'https://api.replicate.com/v1';

    protected function headers(): array
    {
        return [
            'Authorization' => 'Bearer '.$this->config->credential('api_key', ''),
            'Content-Type' => 'application/json',
            'Prefer' => 'wait',
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
            $this->request('GET', $this->endpoint('account'), [], $this->headers());

            return ConnectionResult::ok('Replicate connection successful.', (int) ((microtime(true) - $start) * 1000));
        } catch (ProviderException $exception) {
            return ConnectionResult::failed($exception->getMessage());
        }
    }

    public function listModels(): array
    {
        return [];
    }

    public function generate(AIRequest $request): AIResponse
    {
        $input = [
            'prompt' => $this->flattenMessages($request),
            'max_new_tokens' => $request->maxTokens,
            'temperature' => $request->temperature,
        ];

        $version = (string) $this->config->configValue('version', '');
        $model = $request->model ?: $this->config->defaultModel;

        if ($version !== '') {
            $url = $this->endpoint('predictions');
            $payload = ['version' => $version, 'input' => $input];
        } else {
            $url = $this->endpoint('models/'.ltrim((string) $model, '/').'/predictions');
            $payload = ['input' => $input];
        }

        $json = $this->request('POST', $url, $payload, $this->headers())->json();

        // If the prediction is still running after "Prefer: wait", poll until
        // it finishes (bounded, so a stuck job cannot hang a request forever).
        $deadline = time() + max(5, $this->config->timeout);
        while (in_array($json['status'] ?? null, ['starting', 'processing'], true) && time() < $deadline) {
            usleep(500_000);
            $json = $this->request('GET', $this->endpoint('predictions/'.($json['id'] ?? '')), [], $this->headers())->json();
        }

        if (($json['status'] ?? null) === 'failed') {
            throw new ProviderException('Replicate failed to run the model: '.(string) ($json['error'] ?? 'unknown'), $this->name(), null, false, 'prediction_failed');
        }

        $output = $json['output'] ?? '';
        if (is_array($output)) {
            $output = collect($output)->map(fn ($part) => is_string($part) ? $part : json_encode($part))->implode('');
        }

        return new AIResponse(
            content: (string) $output,
            usage: [],
            model: (string) $model,
            provider: $this->name(),
            finishReason: $json['status'] ?? null,
            raw: $json,
            providerMessageId: $json['id'] ?? null,
        );
    }

    public function stream(AIRequest $request): iterable
    {
        throw new UnsupportedCapabilityException($this->name(), 'streaming');
    }

    protected function flattenMessages(AIRequest $request): string
    {
        $parts = [];
        if (filled($request->system)) {
            $parts[] = (string) $request->system;
        }

        foreach ($request->messages as $message) {
            $role = $message['role'] ?? 'user';
            $parts[] = ucfirst($role).': '.$this->textContent($message['content'] ?? '');
        }

        return implode("\n\n", $parts);
    }
}
