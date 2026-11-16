<?php

namespace App\Services\AI;

use App\Models\AiModel;
use App\Models\AiProvider;
use App\Models\AiProviderLog;
use App\Models\AiUsageLog;
use App\Services\AI\Contracts\AIProviderContract;
use App\Services\AI\DTO\AIRequest;
use App\Services\AI\DTO\AIResponse;
use App\Services\AI\DTO\AIStreamChunk;
use App\Services\AI\DTO\ConnectionResult;
use App\Services\AI\Exceptions\ProviderException;
use App\Services\AiSettings;
use Illuminate\Support\Facades\Log;
use Throwable;

class Manager
{
    public function __construct(
        protected Registry $registry,
        protected AiSettings $legacySettings,
    ) {}

    public function hasDatabaseProviders(): bool
    {
        return AiProvider::query()->exists();
    }

    public function defaultProvider(): ?AiProvider
    {
        return AiProvider::query()
            ->where('enabled', true)
            ->orderByDesc('is_default')
            ->orderBy('fallback_priority')
            ->orderBy('id')
            ->first();
    }

    public function adapterFor(AiProvider $provider): AIProviderContract
    {
        return $this->registry->make(AdapterConfig::fromProvider($provider));
    }

    public function testConnection(AiProvider $provider): ConnectionResult
    {
        $result = $this->adapterFor($provider)->testConnection();

        $provider->forceFill([
            'status' => $result->success ? 'connected' : 'error',
            'last_tested_at' => now(),
            'last_error' => $result->success ? null : mb_substr($result->message, 0, 1000),
        ])->save();

        AiProviderLog::create([
            'ai_provider_id' => $provider->id,
            'user_id' => auth()->id(),
            'action' => 'test_connection',
            'status' => $result->success ? 'success' : 'error',
            'message' => mb_substr($result->message, 0, 1000),
            'context' => ['latency_ms' => $result->latencyMs, 'metadata' => $result->metadata],
            'ip' => request()->ip(),
        ]);

        return $result;
    }

    /**
     * @return array<int, array{id: string, name: string, capabilities: array, context_window: ?int, metadata: array}>
     */
    public function discoverModels(AiProvider $provider): array
    {
        $models = $this->adapterFor($provider)->listModels();

        foreach ($models as $model) {
            $record = AiModel::withTrashed()->firstOrNew([
                'ai_provider_id' => $provider->id,
                'model_id' => $model['id'],
            ]);

            $record->fill([
                'name' => $model['name'] ?? $model['id'],
                'capabilities' => $model['capabilities'] ?? ['text'],
                'context_window' => $model['context_window'] ?? null,
                'metadata' => $model['metadata'] ?? [],
                'discovered_at' => now(),
            ]);

            // Restore a previously removed model when discovery returns it again.
            $record->deleted_at = null;
            $record->save();
        }

        if ($models !== [] && ! $provider->models()->where('is_default', true)->exists()) {
            $provider->models()->where('model_id', $models[0]['id'])->update(['is_default' => true]);
        }

        $provider->forceFill(['status' => 'connected', 'last_tested_at' => now(), 'last_error' => null])->save();

        AiProviderLog::create([
            'ai_provider_id' => $provider->id,
            'user_id' => auth()->id(),
            'action' => 'discover_models',
            'status' => 'success',
            'message' => count($models).' model ditemukan.',
            'context' => ['models_count' => count($models)],
            'ip' => request()->ip(),
        ]);

        return $models;
    }

    /**
     * Generate a completion using the default provider and its fallback chain.
     */
    public function generate(AIRequest $request, ?AiProvider $provider = null): AIResponse
    {
        $candidates = $provider ? collect([$provider]) : $this->fallbackChain();

        if ($candidates->isEmpty()) {
            return $this->generateWithLegacy($request);
        }

        $lastException = null;

        foreach ($candidates as $candidate) {
            $config = AdapterConfig::fromProvider($candidate);
            $adapter = $this->registry->make($config);
            $model = $request->model ?: $config->defaultModel ?: $this->legacySettings->model();
            $startedAt = microtime(true);

            try {
                $response = $adapter->generate($request->withModel($model));
                $this->logUsage($candidate, $request, $response, (int) ((microtime(true) - $startedAt) * 1000));

                $candidate->forceFill([
                    'status' => 'connected',
                    'last_error' => null,
                ])->save();

                return $response;
            } catch (ProviderException $exception) {
                $lastException = $exception;
                $this->logFailure($candidate, $request, $exception, (int) ((microtime(true) - $startedAt) * 1000));

                if (! $this->shouldFallback($exception)) {
                    throw $exception;
                }
            } catch (Throwable $exception) {
                $lastException = new ProviderException(
                    'Provider AI gagal memproses permintaan.',
                    $candidate->name,
                    null,
                    true,
                    'unexpected_error',
                    $exception,
                );

                $this->logFailure($candidate, $request, $lastException, (int) ((microtime(true) - $startedAt) * 1000));
            }
        }

        if ($lastException instanceof ProviderException) {
            throw $lastException;
        }

        throw ProviderException::configuration('AI', 'Tidak ada provider AI yang tersedia.');
    }

    /**
     * @return iterable<AIStreamChunk>
     */
    public function stream(AIRequest $request, ?AiProvider $provider = null): iterable
    {
        $candidates = $provider ? collect([$provider]) : $this->fallbackChain();

        if ($candidates->isEmpty()) {
            $config = $this->legacyConfig();

            if ($config === null) {
                throw ProviderException::configuration('AI', 'Belum ada provider AI yang dikonfigurasi.');
            }

            $adapter = $this->registry->make($config);
            $requested = $request->withModel($request->model ?: $config->defaultModel);

            yield from $adapter->stream($requested);

            return;
        }

        $lastException = null;

        foreach ($candidates as $candidate) {
            $adapter = $this->adapterFor($candidate);
            $startedAt = microtime(true);
            $yielded = false;

            try {
                foreach ($adapter->stream($request->withModel($request->model ?: $candidate->defaultModel())) as $chunk) {
                    $yielded = true;
                    yield $chunk;
                }

                $this->logUsage($candidate, $request, new AIResponse(content: '', usage: [], model: $candidate->defaultModel(), provider: $candidate->name), (int) ((microtime(true) - $startedAt) * 1000));

                return;
            } catch (ProviderException $exception) {
                $lastException = $exception;
                $this->logFailure($candidate, $request, $exception, (int) ((microtime(true) - $startedAt) * 1000));

                // Restarting the stream after partial output would duplicate
                // content for the caller, so only fall back before any chunk.
                if ($yielded || ! $this->shouldFallback($exception)) {
                    throw $exception;
                }
            } catch (Throwable $exception) {
                $lastException = new ProviderException(
                    'Provider AI gagal memproses permintaan streaming.',
                    $candidate->name,
                    null,
                    true,
                    'unexpected_error',
                    $exception,
                );

                $this->logFailure($candidate, $request, $lastException, (int) ((microtime(true) - $startedAt) * 1000));

                if ($yielded) {
                    throw $lastException;
                }
            }
        }

        throw $lastException ?? ProviderException::configuration('AI', 'Tidak ada provider AI yang tersedia.');
    }

    /**
     * Resolve an adapter for a provider, or the legacy single-provider setup.
     */
    public function resolveAdapter(?AiProvider $provider = null): AIProviderContract
    {
        if ($provider) {
            return $this->adapterFor($provider);
        }

        $default = $this->defaultProvider();
        if ($default) {
            return $this->adapterFor($default);
        }

        $config = $this->legacyConfig();

        if ($config === null) {
            throw ProviderException::configuration('AI', 'Belum ada provider AI yang dikonfigurasi.');
        }

        return $this->registry->make($config);
    }

    public function legacyConfig(): ?AdapterConfig
    {
        $setting = $this->legacySettings;

        if (! $setting->isConfigured()) {
            return null;
        }

        $provider = $setting->provider();
        $driver = $provider === 'openai' ? 'openai' : 'openai_compatible';

        return AdapterConfig::legacy(
            driver: $driver,
            name: $provider === 'openai' ? 'OpenAI (legacy)' : 'NVIDIA NIM (legacy)',
            baseUrl: $setting->baseUrl(),
            apiKey: (string) $setting->apiKey(),
            defaultModel: $setting->model(),
            config: ['default_model' => $setting->model()],
        );
    }

    protected function generateWithLegacy(AIRequest $request): AIResponse
    {
        $config = $this->legacyConfig();

        if ($config === null) {
            throw ProviderException::configuration('AI', 'Belum ada provider AI yang dikonfigurasi.');
        }

        $adapter = $this->registry->make($config);
        $model = $request->model ?: $config->defaultModel;

        return $adapter->generate($request->withModel($model));
    }

    protected function fallbackChain()
    {
        return AiProvider::query()
            ->where('enabled', true)
            ->orderByDesc('is_default')
            ->orderBy('fallback_priority')
            ->orderBy('id')
            ->get();
    }

    protected function shouldFallback(ProviderException $exception): bool
    {
        return $exception->retryable || $exception->errorCode === 'configuration_error';
    }

    protected function logUsage(AiProvider $provider, AIRequest $request, AIResponse $response, int $latencyMs): void
    {
        try {
            AiUsageLog::create([
                'ai_provider_id' => $provider->id,
                'user_id' => $request->userId ?? auth()->id(),
                'model' => $response->model ?? $provider->defaultModel(),
                'request_type' => $request->stream ? 'stream' : 'chat',
                'input_tokens' => $response->usageValue('input_tokens'),
                'output_tokens' => $response->usageValue('output_tokens'),
                'total_tokens' => $response->usageValue('total_tokens'),
                'latency_ms' => $latencyMs,
                'success' => true,
                'metadata' => ['provider' => $provider->name, 'finish_reason' => $response->finishReason],
            ]);
        } catch (Throwable $exception) {
            Log::warning('Failed to write AI usage log', ['error' => $exception->getMessage()]);
        }
    }

    protected function logFailure(AiProvider $provider, AIRequest $request, ProviderException $exception, int $latencyMs): void
    {
        try {
            AiUsageLog::create([
                'ai_provider_id' => $provider->id,
                'user_id' => $request->userId ?? auth()->id(),
                'model' => $request->model ?? $provider->defaultModel(),
                'request_type' => 'chat',
                'latency_ms' => $latencyMs,
                'success' => false,
                'error_code' => $exception->errorCode,
                'metadata' => ['message' => mb_substr($exception->getMessage(), 0, 500)],
            ]);

            AiProviderLog::create([
                'ai_provider_id' => $provider->id,
                'user_id' => auth()->id(),
                'action' => 'generate',
                'status' => 'error',
                'message' => mb_substr($exception->getMessage(), 0, 1000),
                'context' => ['status_code' => $exception->statusCode, 'error_code' => $exception->errorCode],
                'ip' => request()->ip(),
            ]);

            $provider->forceFill([
                'status' => 'error',
                'last_error' => mb_substr($exception->getMessage(), 0, 1000),
            ])->save();
        } catch (Throwable $logException) {
            Log::warning('Failed to write AI error log', ['error' => $logException->getMessage()]);
        }
    }
}
