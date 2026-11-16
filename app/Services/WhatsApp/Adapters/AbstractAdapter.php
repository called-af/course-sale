<?php

namespace App\Services\WhatsApp\Adapters;

use App\Services\WhatsApp\AdapterConfig;
use App\Services\WhatsApp\Contracts\WhatsAppProviderContract;
use App\Services\WhatsApp\DTO\WhatsAppSendResult;
use App\Services\WhatsApp\Exceptions\ProviderException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

abstract class AbstractAdapter implements WhatsAppProviderContract
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

    protected function http(array $headers = []): PendingRequest
    {
        return Http::timeout($this->config->timeout)
            ->acceptJson()
            ->asJson()
            ->withHeaders($headers);
    }

    protected function post(string $url, array $payload, array $headers = []): Response
    {
        try {
            $response = $this->http($headers)->post($url, $payload);
        } catch (ConnectionException $exception) {
            throw new ProviderException('Tidak dapat terhubung ke '.$this->name().'.', $this->name(), null, true, 'connection_error', $exception);
        }

        if ($response->failed()) {
            throw ProviderException::fromResponse($this->name(), $response->status(), $response->body());
        }

        return $response;
    }

    protected function get(string $url, array $headers = []): Response
    {
        try {
            $response = $this->http($headers)->get($url);
        } catch (ConnectionException $exception) {
            throw new ProviderException('Tidak dapat terhubung ke '.$this->name().'.', $this->name(), null, true, 'connection_error', $exception);
        }

        if ($response->failed()) {
            throw ProviderException::fromResponse($this->name(), $response->status(), $response->body());
        }

        return $response;
    }

    protected function failure(string $message, ?string $code = null, bool $retryable = false, array $raw = []): WhatsAppSendResult
    {
        return WhatsAppSendResult::failed($message, $code, $retryable, $raw, $this->name());
    }

    protected function verifyHmac(string $rawBody, array $headers, ?string $secret): bool
    {
        if (blank($secret)) {
            // No secret configured: signature verification is intentionally
            // skipped, but the request is still subject to the webhook token
            // and rate-limit guards at the controller level.
            return true;
        }

        $signature = $headers['x-hub-signature-256'][0]
            ?? $headers['x-hub-signature-256']
            ?? $headers['x-infobip-signature'][0]
            ?? $headers['x-infobip-signature']
            ?? $headers['x-webhook-signature'][0]
            ?? $headers['x-webhook-signature']
            ?? null;

        if (is_array($signature)) {
            $signature = $signature[0] ?? null;
        }

        if (! is_string($signature) || $signature === '') {
            return false;
        }

        $signature = str_starts_with($signature, 'sha256=') ? substr($signature, 7) : $signature;
        $expected = hash_hmac('sha256', $rawBody, $secret);

        return hash_equals($expected, $signature);
    }

    abstract protected function headers(): array;
}
