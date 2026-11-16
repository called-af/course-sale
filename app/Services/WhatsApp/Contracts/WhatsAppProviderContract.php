<?php

namespace App\Services\WhatsApp\Contracts;

use App\Services\WhatsApp\DTO\ConnectionResult;
use App\Services\WhatsApp\DTO\NormalizedWebhookEvent;
use App\Services\WhatsApp\DTO\WhatsAppMediaRequest;
use App\Services\WhatsApp\DTO\WhatsAppMessageRequest;
use App\Services\WhatsApp\DTO\WhatsAppMessageStatus;
use App\Services\WhatsApp\DTO\WhatsAppSendResult;
use App\Services\WhatsApp\DTO\WhatsAppTemplateRequest;

interface WhatsAppProviderContract
{
    public function name(): string;

    public function capabilities(): array;

    public function testConnection(): ConnectionResult;

    public function sendMessage(WhatsAppMessageRequest $request): WhatsAppSendResult;

    public function sendMedia(WhatsAppMediaRequest $request): WhatsAppSendResult;

    public function sendTemplate(WhatsAppTemplateRequest $request): WhatsAppSendResult;

    public function sendLocation(string $to, float $latitude, float $longitude, ?string $name = null, ?string $address = null): WhatsAppSendResult;

    public function sendInteractive(string $to, array $interactive, ?string $idempotencyKey = null): WhatsAppSendResult;

    public function getMessageStatus(string $messageId): WhatsAppMessageStatus;

    public function parseWebhook(array $payload, array $headers, string $rawBody = ''): NormalizedWebhookEvent;

    public function verifyWebhook(array $payload, array $headers, string $rawBody = ''): bool;
}
