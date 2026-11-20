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

class FonnteWhatsAppAdapter extends AbstractAdapter
{
    protected string $defaultBaseUrl = 'https://api.fonnte.com';

    protected function headers(): array
    {
        return [
            'Authorization' => (string) $this->config->credential('api_key', ''),
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
            $json = $this->post($this->endpoint('device'), [], $this->headers())->json() ?? [];

            if (($json['status'] ?? false) !== true) {
                return ConnectionResult::failed('Fonnte token rejected: '.($json['reason'] ?? 'unknown'));
            }

            return ConnectionResult::ok(
                'Fonnte connection successful for device '.($json['device'] ?? '-').'.',
                (int) ((microtime(true) - $start) * 1000),
                [
                    'device' => $json['device'] ?? null,
                    'device_status' => $json['device_status'] ?? null,
                    'quota' => $json['quota'] ?? null,
                ],
            );
        } catch (ProviderException $exception) {
            return ConnectionResult::failed($exception->getMessage());
        }
    }

    public function sendMessage(WhatsAppMessageRequest $request): WhatsAppSendResult
    {
        return $this->dispatch([
            'target' => PhoneNumber::normalize($request->to, (string) $this->config->configValue('country_code', '62')),
            'message' => $request->body,
        ]);
    }

    public function sendMedia(WhatsAppMediaRequest $request): WhatsAppSendResult
    {
        if (! in_array($request->type, ['image', 'document', 'video', 'audio'], true)) {
            return $this->failure('Media type is not supported by Fonnte.', 'unsupported_media_type');
        }

        $payload = [
            'target' => PhoneNumber::normalize($request->to, (string) $this->config->configValue('country_code', '62')),
            'message' => $request->caption ?? '',
            'url' => $request->url,
        ];

        if ($request->type === 'document' && filled($request->filename)) {
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
        // Fonnte does not expose a native location payload; send a Maps link
        // instead of pretending to support structured location messages.
        $label = $name ?: 'Lokasi';
        $body = $label.': https://maps.google.com/?q='.$latitude.','.$longitude;
        if (filled($address)) {
            $body .= "\n".$address;
        }

        return $this->sendMessage(new WhatsAppMessageRequest($to, $body));
    }

    public function sendInteractive(string $to, array $interactive, ?string $idempotencyKey = null): WhatsAppSendResult
    {
        throw new UnsupportedCapabilityException($this->name(), 'interactive messages');
    }

    protected function dispatch(array $payload): WhatsAppSendResult
    {
        try {
            $json = $this->post($this->endpoint('send'), $payload, $this->headers())->json() ?? [];

            if (($json['status'] ?? true) === false) {
                return $this->failure(
                    (string) ($json['reason'] ?? 'Fonnte rejected the message.'),
                    (string) ($json['reason'] ?? 'send_failed'),
                    false,
                    $json,
                );
            }

            $id = $json['id'] ?? $json['requestid'] ?? data_get($json, 'detail.id');

            return WhatsAppSendResult::ok(
                is_array($id) ? (string) ($id[0] ?? null) : (string) ($id ?? ''),
                'sent',
                $json,
                $this->name(),
            );
        } catch (ProviderException $exception) {
            return $this->failure($exception->getMessage(), $exception->errorCode, $exception->retryable);
        }
    }

    public function getMessageStatus(string $messageId): WhatsAppMessageStatus
    {
        throw new UnsupportedCapabilityException($this->name(), 'message status lookup');
    }

    public function parseWebhook(array $payload, array $headers, string $rawBody = ''): NormalizedWebhookEvent
    {
        $messages = [];
        $statuses = [];

        $sender = (string) ($payload['sender'] ?? $payload['from'] ?? '');
        $text = $payload['message'] ?? $payload['text'] ?? null;
        $status = $payload['status'] ?? null;

        if ($sender !== '' && $text !== null) {
            $messages[] = [
                'provider' => $this->name(),
                'event' => (string) ($payload['type'] ?? 'inbound_message'),
                'provider_message_id' => (string) ($payload['id'] ?? $payload['message_id'] ?? ''),
                'from' => PhoneNumber::normalize($sender),
                'to' => (string) ($payload['device'] ?? ''),
                'contact_name' => $payload['name'] ?? $payload['pushname'] ?? null,
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
                'recipient' => (string) ($payload['target'] ?? $payload['to'] ?? ''),
                'status' => strtolower((string) $status),
                'provider_status' => (string) $status,
                'description' => null,
                'timestamp' => isset($payload['timestamp']) ? (int) $payload['timestamp'] : null,
                'raw' => $payload,
            ];
        }

        $event = $messages !== [] ? 'message' : ($statuses !== [] ? 'status' : 'unknown');

        return new NormalizedWebhookEvent($this->name(), $event, $messages, $statuses, $payload);
    }

    public function verifyWebhook(array $payload, array $headers, string $rawBody = ''): bool
    {
        $expected = $this->config->credential('webhook_token');

        if (blank($expected)) {
            return true;
        }

        $provided = request()->query('token')
            ?? ($headers['x-webhook-token'][0] ?? $headers['x-webhook-token'] ?? null);

        if (is_array($provided)) {
            $provided = $provided[0] ?? null;
        }

        return is_string($provided) && hash_equals((string) $expected, $provided);
    }
}
