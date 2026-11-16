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

class InfobipWhatsAppAdapter extends AbstractAdapter
{
    protected function headers(): array
    {
        return [
            'Authorization' => 'App '.$this->config->credential('api_key', ''),
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ];
    }

    protected function endpoint(string $path): string
    {
        $base = $this->config->baseUrl();

        if ($base === '') {
            throw ProviderException::configuration($this->name(), 'Base URL Infobip wajib diisi.');
        }

        return $base.'/'.ltrim($path, '/');
    }

    protected function sender(): string
    {
        $from = (string) $this->config->configValue('from', '');

        if ($from === '') {
            throw ProviderException::configuration($this->name(), 'Sender number Infobip wajib diisi.');
        }

        return $from;
    }

    public function testConnection(): ConnectionResult
    {
        $start = microtime(true);

        try {
            $json = $this->get($this->endpoint('whatsapp/1/senders'), $this->headers())->json() ?? [];

            return ConnectionResult::ok(
                'Koneksi Infobip berhasil.',
                (int) ((microtime(true) - $start) * 1000),
                ['senders' => count($json['senders'] ?? $json ?? [])],
            );
        } catch (ProviderException $exception) {
            if (in_array($exception->statusCode, [404, 405], true)) {
                return ConnectionResult::ok(
                    'Base URL dan kredensial tersimpan. Endpoint daftar sender tidak tersedia pada tenant ini.',
                    (int) ((microtime(true) - $start) * 1000),
                );
            }

            return ConnectionResult::failed($exception->getMessage());
        }
    }

    public function sendMessage(WhatsAppMessageRequest $request): WhatsAppSendResult
    {
        return $this->dispatch('whatsapp/1/message/text', [
            'from' => $this->safeSender(),
            'to' => PhoneNumber::normalize($request->to),
            'content' => ['text' => $request->body],
        ], $request->idempotencyKey);
    }

    public function sendMedia(WhatsAppMediaRequest $request): WhatsAppSendResult
    {
        $path = match ($request->type) {
            'image' => 'whatsapp/1/message/image',
            'document' => 'whatsapp/1/message/document',
            'video' => 'whatsapp/1/message/video',
            'audio' => 'whatsapp/1/message/audio',
            default => null,
        };

        if ($path === null) {
            return $this->failure('Tipe media tidak didukung Infobip.', 'unsupported_media_type');
        }

        $content = ['mediaUrl' => $request->url];

        if (in_array($request->type, ['image', 'video'], true) && filled($request->caption)) {
            $content['caption'] = $request->caption;
        }

        if ($request->type === 'document' && filled($request->filename)) {
            $content['filename'] = $request->filename;
        }

        return $this->dispatch($path, [
            'from' => $this->safeSender(),
            'to' => PhoneNumber::normalize($request->to),
            'content' => $content,
        ], $request->idempotencyKey);
    }

    public function sendTemplate(WhatsAppTemplateRequest $request): WhatsAppSendResult
    {
        return $this->dispatch('whatsapp/1/message/template', [
            'messages' => [[
                'from' => $this->safeSender(),
                'to' => PhoneNumber::normalize($request->to),
                'content' => [
                    'templateName' => $request->name,
                    'language' => $request->language,
                    'templateData' => [
                        'body' => [
                            'placeholders' => array_map(fn ($value) => (string) $value, $request->parameters),
                        ],
                    ],
                ],
            ]],
        ], $request->idempotencyKey);
    }

    public function sendLocation(string $to, float $latitude, float $longitude, ?string $name = null, ?string $address = null): WhatsAppSendResult
    {
        $content = [
            'latitude' => $latitude,
            'longitude' => $longitude,
        ];

        if (filled($name)) {
            $content['name'] = $name;
        }

        if (filled($address)) {
            $content['address'] = $address;
        }

        return $this->dispatch('whatsapp/1/message/location', [
            'from' => $this->safeSender(),
            'to' => PhoneNumber::normalize($to),
            'content' => $content,
        ]);
    }

    public function sendInteractive(string $to, array $interactive, ?string $idempotencyKey = null): WhatsAppSendResult
    {
        throw new UnsupportedCapabilityException($this->name(), 'interactive messages');
    }

    protected function dispatch(string $path, array $payload, ?string $idempotencyKey = null): WhatsAppSendResult
    {
        try {
            $headers = $this->headers();
            if (filled($idempotencyKey)) {
                $headers['X-Idempotency-Key'] = (string) $idempotencyKey;
            }

            $json = $this->post($this->endpoint($path), $payload, $headers)->json() ?? [];
            $statusGroup = data_get($json, 'status.groupName');
            $messageId = $json['messageId'] ?? data_get($json, 'messages.0.messageId');

            if ($statusGroup === 'REJECTED') {
                return $this->failure(
                    (string) (data_get($json, 'status.description') ?? 'Infobip menolak pesan.'),
                    (string) data_get($json, 'status.name', 'rejected'),
                    false,
                    $json,
                );
            }

            return WhatsAppSendResult::ok($messageId, 'sent', $json, $this->name());
        } catch (ProviderException $exception) {
            return $this->failure($exception->getMessage(), $exception->errorCode, $exception->retryable);
        }
    }

    protected function safeSender(): string
    {
        try {
            return $this->sender();
        } catch (ProviderException $exception) {
            throw $exception;
        }
    }

    public function getMessageStatus(string $messageId): WhatsAppMessageStatus
    {
        try {
            $json = $this->get(
                $this->endpoint('whatsapp/1/reports?messageId='.rawurlencode($messageId).'&limit=1'),
                $this->headers()
            )->json() ?? [];

            $result = $json['results'][0] ?? [];
            $status = strtoupper((string) data_get($result, 'status.groupName', 'UNKNOWN'));

            return new WhatsAppMessageStatus(
                messageId: $messageId,
                status: match ($status) {
                    'DELIVERED' => 'delivered',
                    'READ' => 'read',
                    'PENDING' => 'pending',
                    'UNDELIVERABLE', 'REJECTED' => 'failed',
                    default => strtolower($status),
                },
                recipient: $result['to'] ?? null,
                description: data_get($result, 'status.description'),
                raw: $result,
            );
        } catch (ProviderException $exception) {
            return new WhatsAppMessageStatus($messageId, 'unknown', null, $exception->getMessage());
        }
    }

    public function parseWebhook(array $payload, array $headers, string $rawBody = ''): NormalizedWebhookEvent
    {
        $items = $payload['results'] ?? $payload['messages'] ?? (array_is_list($payload) ? $payload : []);
        $messages = [];
        $statuses = [];
        $event = 'unknown';

        foreach ($items as $item) {
            $text = data_get($item, 'message.text')
                ?? data_get($item, 'text')
                ?? data_get($item, 'content.text')
                ?? data_get($item, 'message.caption');

            $from = (string) ($item['from'] ?? data_get($item, 'message.from') ?? '');
            $to = (string) ($item['to'] ?? '');
            $messageId = (string) ($item['messageId'] ?? $item['id'] ?? '');
            $statusGroup = data_get($item, 'status.groupName');

            if ($statusGroup !== null) {
                $event = 'status';
                $statuses[] = [
                    'provider' => $this->name(),
                    'provider_message_id' => $messageId,
                    'recipient' => $to,
                    'status' => match (strtoupper((string) $statusGroup)) {
                        'DELIVERED' => 'delivered',
                        'READ' => 'read',
                        'PENDING' => 'pending',
                        'UNDELIVERABLE', 'REJECTED' => 'failed',
                        default => strtolower((string) $statusGroup),
                    },
                    'provider_status' => data_get($item, 'status.name'),
                    'description' => data_get($item, 'status.description'),
                    'timestamp' => isset($item['doneAt']) ? strtotime((string) $item['doneAt']) : null,
                    'raw' => $item,
                ];

                continue;
            }

            if ($text !== null || $from !== '') {
                $event = 'message';
                $messages[] = [
                    'provider' => $this->name(),
                    'event' => 'inbound_message',
                    'provider_message_id' => $messageId,
                    'from' => $from !== '' ? PhoneNumber::normalize($from) : '',
                    'to' => $to,
                    'contact_name' => $item['contactName'] ?? data_get($item, 'contact.name'),
                    'type' => (string) ($item['type'] ?? 'text'),
                    'body' => is_string($text) ? $text : json_encode($text),
                    'media_url' => data_get($item, 'message.url') ?? data_get($item, 'mediaUrl'),
                    'timestamp' => isset($item['receivedAt']) ? strtotime((string) $item['receivedAt']) : null,
                    'raw' => $item,
                ];
            }
        }

        return new NormalizedWebhookEvent($this->name(), $event, $messages, $statuses, $payload);
    }

    public function verifyWebhook(array $payload, array $headers, string $rawBody = ''): bool
    {
        return $this->verifyHmac($rawBody, $headers, $this->config->credential('webhook_secret'));
    }
}
