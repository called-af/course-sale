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
use App\Support\PhoneNumber;

class MetaWhatsAppAdapter extends AbstractAdapter
{
    protected string $defaultBaseUrl = 'https://graph.facebook.com';

    protected function headers(): array
    {
        return [
            'Authorization' => 'Bearer '.$this->config->credential('access_token', ''),
            'Content-Type' => 'application/json',
        ];
    }

    protected function version(): string
    {
        return (string) $this->config->configValue('api_version', 'v21.0');
    }

    protected function phoneNumberId(): string
    {
        $id = (string) $this->config->configValue('phone_number_id', '');

        if ($id === '') {
            throw ProviderException::configuration($this->name(), 'Phone Number ID is required for the Meta WhatsApp Cloud API.');
        }

        return $id;
    }

    protected function messagesUrl(): string
    {
        return $this->config->baseUrl($this->defaultBaseUrl).'/'.$this->version().'/'.$this->phoneNumberId().'/messages';
    }

    public function testConnection(): ConnectionResult
    {
        $start = microtime(true);

        try {
            $url = $this->config->baseUrl($this->defaultBaseUrl).'/'.$this->version().'/'.$this->phoneNumberId()
                .'?fields=verified_name,display_phone_number,quality_rating';

            $json = $this->get($url, $this->headers())->json();

            return ConnectionResult::ok(
                'Meta WhatsApp connection successful for '.($json['display_phone_number'] ?? $this->phoneNumberId()).'.',
                (int) ((microtime(true) - $start) * 1000),
                [
                    'verified_name' => $json['verified_name'] ?? null,
                    'display_phone_number' => $json['display_phone_number'] ?? null,
                    'quality_rating' => $json['quality_rating'] ?? null,
                ],
            );
        } catch (ProviderException $exception) {
            return ConnectionResult::failed($exception->getMessage());
        }
    }

    public function sendMessage(WhatsAppMessageRequest $request): WhatsAppSendResult
    {
        return $this->dispatch([
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => PhoneNumber::normalize($request->to),
            'type' => 'text',
            'text' => [
                'preview_url' => $request->previewUrl,
                'body' => $request->body,
            ],
        ], $request->idempotencyKey);
    }

    public function sendMedia(WhatsAppMediaRequest $request): WhatsAppSendResult
    {
        $type = $request->type;
        if (! in_array($type, ['image', 'document', 'video', 'audio'], true)) {
            return $this->failure('Media type is not supported by the Meta Cloud API.', 'unsupported_media_type');
        }

        $media = ['link' => $request->url];

        if ($type !== 'audio') {
            if (filled($request->caption)) {
                $media['caption'] = $request->caption;
            }
        }

        if ($type === 'document' && filled($request->filename)) {
            $media['filename'] = $request->filename;
        }

        return $this->dispatch([
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => PhoneNumber::normalize($request->to),
            'type' => $type,
            $type => $media,
        ], $request->idempotencyKey);
    }

    public function sendTemplate(WhatsAppTemplateRequest $request): WhatsAppSendResult
    {
        $parameters = array_map(fn ($value) => [
            'type' => 'text',
            'text' => (string) $value,
        ], $request->parameters);

        $components = $request->components;

        if ($components === [] && $parameters !== []) {
            $components = [[
                'type' => 'body',
                'parameters' => $parameters,
            ]];
        }

        $payload = [
            'messaging_product' => 'whatsapp',
            'to' => PhoneNumber::normalize($request->to),
            'type' => 'template',
            'template' => [
                'name' => $request->name,
                'language' => ['code' => $request->language],
            ],
        ];

        if ($components !== []) {
            $payload['template']['components'] = $components;
        }

        return $this->dispatch($payload, $request->idempotencyKey);
    }

    public function sendLocation(string $to, float $latitude, float $longitude, ?string $name = null, ?string $address = null): WhatsAppSendResult
    {
        $location = [
            'latitude' => $latitude,
            'longitude' => $longitude,
        ];

        if (filled($name)) {
            $location['name'] = $name;
        }

        if (filled($address)) {
            $location['address'] = $address;
        }

        return $this->dispatch([
            'messaging_product' => 'whatsapp',
            'to' => PhoneNumber::normalize($to),
            'type' => 'location',
            'location' => $location,
        ]);
    }

    public function sendInteractive(string $to, array $interactive, ?string $idempotencyKey = null): WhatsAppSendResult
    {
        return $this->dispatch([
            'messaging_product' => 'whatsapp',
            'to' => PhoneNumber::normalize($to),
            'type' => 'interactive',
            'interactive' => $interactive,
        ], $idempotencyKey);
    }

    protected function dispatch(array $payload, ?string $idempotencyKey = null): WhatsAppSendResult
    {
        try {
            $response = $this->post($this->messagesUrl(), $payload, $this->headers());
            $json = $response->json() ?? [];
            $messageId = $json['messages'][0]['id'] ?? null;

            return WhatsAppSendResult::ok($messageId, 'sent', $json, $this->name());
        } catch (ProviderException $exception) {
            return $this->failure($exception->getMessage(), $exception->errorCode, $exception->retryable);
        }
    }

    public function getMessageStatus(string $messageId): WhatsAppMessageStatus
    {
        try {
            $url = $this->config->baseUrl($this->defaultBaseUrl).'/'.$this->version().'/'.rawurlencode($messageId).'?fields=status,error';
            $json = $this->get($url, $this->headers())->json() ?? [];

            return new WhatsAppMessageStatus(
                messageId: $messageId,
                status: (string) ($json['status'] ?? 'unknown'),
                recipient: $json['to'] ?? null,
                description: data_get($json, 'error.message'),
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
        $event = 'unknown';

        foreach ($payload['entry'] ?? [] as $entry) {
            foreach ($entry['changes'] ?? [] as $change) {
                $field = (string) ($change['field'] ?? 'unknown');
                $value = $change['value'] ?? [];
                $contacts = collect($value['contacts'] ?? [])->keyBy('wa_id');

                foreach ($value['messages'] ?? [] as $message) {
                    $event = 'message';
                    $from = (string) ($message['from'] ?? '');
                    $type = (string) ($message['type'] ?? 'text');
                    $text = data_get($message, 'text.body')
                        ?? data_get($message, $type.'.caption')
                        ?? data_get($message, 'button.text')
                        ?? data_get($message, 'interactive.button_reply.title')
                        ?? null;

                    $messages[] = [
                        'provider' => $this->name(),
                        'event' => $field,
                        'provider_message_id' => (string) ($message['id'] ?? ''),
                        'from' => $from,
                        'to' => (string) ($value['metadata']['display_phone_number'] ?? ''),
                        'contact_name' => data_get($contacts->get($from), 'profile.name'),
                        'type' => $type,
                        'body' => $text,
                        'media_id' => data_get($message, $type.'.id'),
                        'media_url' => data_get($message, $type.'.link'),
                        'timestamp' => isset($message['timestamp']) ? (int) $message['timestamp'] : null,
                        'raw' => $message,
                    ];
                }

                foreach ($value['statuses'] ?? [] as $status) {
                    $event = 'status';
                    $statuses[] = [
                        'provider' => $this->name(),
                        'provider_message_id' => (string) ($status['id'] ?? ''),
                        'recipient' => (string) ($status['recipient_id'] ?? ''),
                        'status' => (string) ($status['status'] ?? 'unknown'),
                        'timestamp' => isset($status['timestamp']) ? (int) $status['timestamp'] : null,
                        'error_code' => data_get($status, 'errors.0.code'),
                        'error_message' => data_get($status, 'errors.0.title') ?? data_get($status, 'errors.0.message'),
                        'raw' => $status,
                    ];
                }
            }
        }

        return new NormalizedWebhookEvent($this->name(), $event, $messages, $statuses, $payload);
    }

    public function verifyWebhook(array $payload, array $headers, string $rawBody = ''): bool
    {
        $secret = $this->config->credential('app_secret');

        return $this->verifyHmac($rawBody, $headers, $secret);
    }
}
