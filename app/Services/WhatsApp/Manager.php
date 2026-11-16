<?php

namespace App\Services\WhatsApp;

use App\Models\WhatsAppDeliveryLog;
use App\Models\WhatsAppProvider;
use App\Models\WhatsAppSetting;
use App\Services\WhatsApp\Contracts\WhatsAppProviderContract;
use App\Services\WhatsApp\DTO\ConnectionResult;
use App\Services\WhatsApp\DTO\NormalizedWebhookEvent;
use App\Services\WhatsApp\DTO\WhatsAppMediaRequest;
use App\Services\WhatsApp\DTO\WhatsAppMessageRequest;
use App\Services\WhatsApp\DTO\WhatsAppMessageStatus;
use App\Services\WhatsApp\DTO\WhatsAppSendResult;
use App\Services\WhatsApp\DTO\WhatsAppTemplateRequest;
use App\Services\WhatsApp\Exceptions\ProviderException;
use App\Services\WhatsApp\Exceptions\UnsupportedCapabilityException;
use Illuminate\Database\Eloquent\Collection;

class Manager
{
    public function __construct(protected Registry $registry) {}

    public function hasDatabaseProviders(): bool
    {
        return WhatsAppProvider::query()->exists();
    }

    public function defaultProvider(): ?WhatsAppProvider
    {
        return WhatsAppProvider::query()
            ->where('enabled', true)
            ->orderByDesc('is_default')
            ->orderBy('id')
            ->first();
    }

    public function adapterFor(WhatsAppProvider $provider): WhatsAppProviderContract
    {
        return $this->registry->make(AdapterConfig::fromProvider($provider));
    }

    public function haveUsableProvider(): bool
    {
        try {
            $this->resolveAdapter();

            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    public function resolveAdapter(?WhatsAppProvider $provider = null): WhatsAppProviderContract
    {
        if ($provider) {
            return $this->adapterFor($provider);
        }

        $default = $this->defaultProvider();
        if ($default) {
            return $this->adapterFor($default);
        }

        return $this->legacyAdapter();
    }

    public function testConnection(WhatsAppProvider $provider): ConnectionResult
    {
        $result = $this->adapterFor($provider)->testConnection();

        $provider->forceFill([
            'status' => $result->success ? 'connected' : 'error',
            'last_tested_at' => now(),
            'last_error' => $result->success ? null : mb_substr($result->message, 0, 1000),
        ])->save();

        WhatsAppDeliveryLog::create([
            'whatsapp_provider_id' => $provider->id,
            'status' => $result->success ? 'connected' : 'error',
            'provider_status' => $result->success ? 'success' : 'failed',
            'description' => mb_substr($result->message, 0, 1000),
            'payload' => ['latency_ms' => $result->latencyMs, 'metadata' => $result->metadata],
        ]);

        return $result;
    }

    public function sendText(WhatsAppMessageRequest $request, ?WhatsAppProvider $provider = null): WhatsAppSendResult
    {
        return $this->sendWithFallback(
            fn (WhatsAppProviderContract $adapter) => $adapter->sendMessage($request),
            $provider,
            $request->idempotencyKey,
        );
    }

    public function sendMedia(WhatsAppMediaRequest $request, ?WhatsAppProvider $provider = null): WhatsAppSendResult
    {
        return $this->sendWithFallback(
            fn (WhatsAppProviderContract $adapter) => $adapter->sendMedia($request),
            $provider,
            $request->idempotencyKey,
        );
    }

    public function sendTemplate(WhatsAppTemplateRequest $request, ?WhatsAppProvider $provider = null): WhatsAppSendResult
    {
        return $this->sendWithFallback(
            fn (WhatsAppProviderContract $adapter) => $adapter->sendTemplate($request),
            $provider,
            $request->idempotencyKey,
        );
    }

    public function sendLocation(string $to, float $latitude, float $longitude, ?string $name = null, ?string $address = null, ?WhatsAppProvider $provider = null): WhatsAppSendResult
    {
        return $this->sendWithFallback(
            fn (WhatsAppProviderContract $adapter) => $adapter->sendLocation($to, $latitude, $longitude, $name, $address),
            $provider,
            null,
        );
    }

    public function sendInteractive(string $to, array $interactive, ?string $idempotencyKey = null, ?WhatsAppProvider $provider = null): WhatsAppSendResult
    {
        return $this->sendWithFallback(
            fn (WhatsAppProviderContract $adapter) => $adapter->sendInteractive($to, $interactive, $idempotencyKey),
            $provider,
            $idempotencyKey,
        );
    }

    public function getMessageStatus(string $messageId, ?WhatsAppProvider $provider = null): WhatsAppMessageStatus
    {
        return $this->resolveAdapter($provider)->getMessageStatus($messageId);
    }

    public function parseWebhook(WhatsAppProvider $provider, array $payload, array $headers, string $rawBody = ''): NormalizedWebhookEvent
    {
        $adapter = $this->adapterFor($provider);

        if (! $adapter->verifyWebhook($payload, $headers, $rawBody)) {
            throw new ProviderException('Signature webhook tidak valid.', $provider->name, 403, false, 'invalid_signature');
        }

        return $adapter->parseWebhook($payload, $headers, $rawBody);
    }

    protected function sendWithFallback(callable $send, ?WhatsAppProvider $provider, ?string $idempotencyKey): WhatsAppSendResult
    {
        $candidates = $provider
            ? new Collection([$provider])
            : WhatsAppProvider::query()->where('enabled', true)->orderByDesc('is_default')->orderBy('id')->get();

        if ($candidates->isEmpty()) {
            return $send($this->legacyAdapter());
        }

        $last = null;

        foreach ($candidates as $candidate) {
            try {
                $result = $send($this->adapterFor($candidate));
            } catch (UnsupportedCapabilityException $exception) {
                // Nothing was dispatched, so it is safe to try the next provider.
                $last = WhatsAppSendResult::failed(
                    $exception->getMessage(),
                    'unsupported_capability',
                    false,
                    [],
                    $candidate->name,
                );

                continue;
            } catch (ProviderException $exception) {
                $last = WhatsAppSendResult::failed(
                    $exception->getMessage(),
                    $exception->errorCode,
                    $exception->retryable,
                    [],
                    $exception->provider ?? $candidate->name,
                );

                // Configuration errors are raised before the request is sent,
                // so falling through to another provider is safe.
                if ($exception->errorCode === 'configuration_error') {
                    continue;
                }

                $result = $last;
            }

            $last = $result;

            if ($result->success) {
                return $result;
            }

            // Never retry a non-idempotent send through another provider. The
            // caller must supply an idempotency key to opt into fallback.
            $canFallback = $result->retryable && filled($idempotencyKey);
            if (! $canFallback) {
                return $result;
            }
        }

        return $last ?? WhatsAppSendResult::failed('Tidak ada provider WhatsApp yang tersedia.', 'no_provider');
    }

    protected function legacyAdapter(): WhatsAppProviderContract
    {
        $setting = WhatsAppSetting::current();

        $driver = in_array($setting->provider, ['meta', 'infobip', 'fonnte', 'custom'], true)
            ? (string) $setting->provider
            : 'infobip';

        if ($driver === 'meta') {
            $config = AdapterConfig::legacy(
                driver: 'meta',
                name: 'Meta WhatsApp (legacy)',
                baseUrl: 'https://graph.facebook.com',
                credentials: [
                    'access_token' => (string) config('services.whatsapp.access_token'),
                    'app_secret' => (string) config('services.whatsapp.app_secret'),
                    'verify_token' => (string) config('services.whatsapp.verify_token'),
                ],
                config: [
                    'phone_number_id' => (string) config('services.whatsapp.phone_number_id'),
                    'api_version' => (string) config('services.whatsapp.api_version', 'v21.0'),
                ],
            );
        } else {
            $config = AdapterConfig::legacy(
                driver: $driver,
                name: 'WhatsApp Gateway (legacy)',
                baseUrl: $setting->base_url ?: (string) config('services.whatsapp.infobip.base_url'),
                credentials: [
                    'api_key' => (string) ($setting->api_key ?: config('services.whatsapp.infobip.api_key')),
                ],
                config: [
                    'from' => (string) ($setting->from_number ?: config('services.whatsapp.infobip.from')),
                    'sandbox_keyword' => (string) ($setting->sandbox_keyword ?: config('services.whatsapp.infobip.sandbox_keyword')),
                ],
            );
        }

        if (blank($config->baseUrl) && $driver !== 'meta') {
            throw ProviderException::configuration('WhatsApp', 'Belum ada provider WhatsApp yang dikonfigurasi.');
        }

        return $this->registry->make($config);
    }
}
