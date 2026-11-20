<?php

namespace App\Services\WhatsApp\Adapters;

use App\Services\WhatsApp\DTO\ConnectionResult;
use App\Services\WhatsApp\DTO\NormalizedWebhookEvent;
use App\Services\WhatsApp\DTO\WhatsAppMediaRequest;
use App\Services\WhatsApp\DTO\WhatsAppMessageRequest;
use App\Services\WhatsApp\DTO\WhatsAppMessageStatus;
use App\Services\WhatsApp\DTO\WhatsAppSendResult;
use App\Services\WhatsApp\DTO\WhatsAppTemplateRequest;
use App\Services\WhatsApp\Exceptions\ProviderException;
use App\Services\WhatsApp\Exceptions\UnsupportedCapabilityException;
use App\Support\PhoneNumber;

/**
 * Generic JSON gateway adapter. The request contract is configured explicitly
 * in the provider settings (send path, auth header, recipient/message fields)
 * instead of guessing a vendor-specific payload.
 */
class CustomWhatsAppAdapter extends AbstractAdapter
{
    protected function headers(): array
    {
        $header = (string) $this->config->configValue('auth_header', 'Authorization');
        $prefix = (string) $this->config->configValue('auth_prefix', 'Bearer ');
        $token = (string) $this->config->credential('api_key', '');

        $headers = ['Content-Type' => 'application/json'];

        if ($token !== '') {
            $headers[$header] = $prefix.$token;
        }

        return $headers;
    }

    protected function endpoint(string $path): string
    {
        $base = $this->config->baseUrl();

        if ($base === '') {
            throw ProviderException::configuration($this->name(), 'Custom gateway Base URL is required.');
        }

        return $base.'/'.ltrim($path, '/');
    }

    public function testConnection(): ConnectionResult
    {
        $start = microtime(true);
        $statusPath = (string) $this->config->configValue('status_path', '');

        if ($statusPath === '') {
            return ConnectionResult::ok(
                'Custom gateway configuration is valid. No health endpoint is configured.',
                null,
                ['configuration_only' => true],
            );
        }

        try {
            $this->get($this->endpoint($statusPath), $this->headers());

            return ConnectionResult::ok('Custom gateway connection successful.', (int) ((microtime(true) - $start) * 1000));
        } catch (ProviderException $exception) {
            return ConnectionResult::failed($exception->getMessage());
        }
    }

    public function sendMessage(WhatsAppMessageRequest $request): WhatsAppSendResult
    {
        $payload = [
            (string) $this->config->configValue('to_field', 'to') => PhoneNumber::normalize($request->to),
            (string) $this->config->configValue('message_field', 'message') => $request->body,
        ];

        $from = $this->config->configValue('from');
        if (filled($from)) {
            $payload['from'] = $from;
        }

        return $this->dispatch($payload);
    }

    public function sendMedia(WhatsAppMediaRequest $request): WhatsAppSendResult
    {
        $payload = [
            (string) $this->config->configValue('to_field', 'to') => PhoneNumber::normalize($request->to),
            'type' => $request->type,
            'url' => $request->url,
        ];

        if (filled($request->caption)) {
            $payload[(string) $this->config->configValue('message_field', 'message')] = $request->caption;
        }

        if (filled($request->filename)) {
            $payload['filename'] = $request->filename;
        }

        return $this->dispatch($payload);
    }

    public function sendTemplate(WhatsAppTemplateRequest $request): WhatsAppSendResult
    {
        throw new UnsupportedCapabilityException($this->name(), 'template messages');
    }

    public function sendLocation(string $to, float $latitude, float $longitude, ?string $name = null, ?string $address = null): WhatsAppSendResult
    {
        return $this->dispatch([
            (string) $this->config->configValue('to_field', 'to') => PhoneNumber::normalize($to),
            'type' => 'location',
            'latitude' => $latitude,
            'longitude' => $longitude,
            'name' => $name,
            'address' => $address,
        ]);
    }

    public function sendInteractive(string $to, array $interactive, ?string $idempotencyKey = null): WhatsAppSendResult
    {
        return $this->dispatch([
            (string) $this->config->configValue('to_field', 'to') => PhoneNumber::normalize($to),
            'type' => 'interactive',
            'interactive' => $interactive,
        ]);
    }

    protected function dispatch(array $payload): WhatsAppSendResult
    {
        try {
            $method = strtoupper((string) $this->config->configValue('send_method', 'POST'));
            $url = $this->endpoint((string) $this->config->configValue('send_path', '/messages'));

            $response = $method === 'GET'
                ? $this->get($url.'?'.http_build_query($payload), $this->headers())
                : $this->post($url, $payload, $this->headers());

            $json = $response->json() ?? [];

            $messageId = $json['message_id']
                ?? $json['id']
                ?? data_get($json, 'data.id')
                ?? data_get($json, 'message.id');

            $success = $json['success']
                ?? $json['status']
                ?? $response->successful();

            if ($success === false || $success === 'false') {
                return $this->failure(
                    (string) ($json['error'] ?? $json['message'] ?? 'The gateway rejected the message.'),
                    (string) ($json['code'] ?? 'send_failed'),
                    false,
                    $json,
                );
            }

            return WhatsAppSendResult::ok($messageId !== null ? (string) $messageId : null, 'sent', $json, $this->name());
        } catch (ProviderException $exception) {
            return $this->failure($exception->getMessage(), $exception->errorCode, $exception->retryable);
        }
    }

    public function getMessageStatus(string $messageId): WhatsAppMessageStatus
    {
        $statusPath = (string) $this->config->configValue('status_path', '');

        if ($statusPath === '') {
            throw new UnsupportedCapabilityException($this->name(), 'message status lookup');
        }

        try {
            $json = $this->get(
                $this->endpoint($statusPath).'?message_id='.rawurlencode($messageId),
                $this->headers()
            )->json() ?? [];

            return new WhatsAppMessageStatus(
                messageId: $messageId,
                status: (string) ($json['status'] ?? $json['state'] ?? 'unknown'),
                recipient: $json['to'] ?? null,
                description: $json['description'] ?? $json['error'] ?? null,
                raw: $json,
            );
        } catch (ProviderException $exception) {
            return new WhatsAppMessageStatus($messageId, 'unknown', null, $exception->getMessage());
        }
    }

    public function parseWebhook(array $payload, array $headers, string $rawBody = ''): NormalizedWebhookEvent
    {
        $messages = [];
        $statuses = [];

        $from = $payload['from'] ?? $payload['sender'] ?? $payload['phone'] ?? null;
        $text = $payload['message'] ?? $payload['text'] ?? $payload['body'] ?? null;
        $status = $payload['status'] ?? $payload['state'] ?? null;

        if ($from !== null && $text !== null) {
            $messages[] = [
                'provider' => $this->name(),
                'event' => 'inbound_message',
                'provider_message_id' => (string) ($payload['id'] ?? $payload['message_id'] ?? ''),
                'from' => PhoneNumber::normalize((string) $from),
                'to' => (string) ($payload['to'] ?? ''),
                'contact_name' => $payload['name'] ?? null,
                'type' => (string) ($payload['type'] ?? 'text'),
                'body' => is_string($text) ? $text : json_encode($text),
                'media_url' => $payload['url'] ?? null,
                'timestamp' => isset($payload['timestamp']) ? (int) $payload['timestamp'] : null,
                'raw' => $payload,
            ];
        } elseif ($status !== null) {
            $statuses[] = [
                'provider' => $this->name(),
                'provider_message_id' => (string) ($payload['id'] ?? $payload['message_id'] ?? ''),
                'recipient' => (string) ($payload['to'] ?? $payload['recipient'] ?? ''),
                'status' => strtolower((string) $status),
                'provider_status' => (string) $status,
                'description' => $payload['description'] ?? null,
                'timestamp' => isset($payload['timestamp']) ? (int) $payload['timestamp'] : null,
                'raw' => $payload,
            ];
        }

        $event = $messages !== [] ? 'message' : ($statuses !== [] ? 'status' : 'unknown');

        return new NormalizedWebhookEvent($this->name(), $event, $messages, $statuses, $payload);
    }

    public function verifyWebhook(array $payload, array $headers, string $rawBody = ''): bool
    {
        $secret = $this->config->credential('webhook_secret');

        if (blank($secret)) {
            return true;
        }

        return $this->verifyHmac($rawBody, $headers, $secret);
    }
}
