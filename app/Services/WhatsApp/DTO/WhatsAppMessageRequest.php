<?php

namespace App\Services\WhatsApp\DTO;

class WhatsAppMessageRequest
{
    public function __construct(
        public readonly string $to,
        public readonly string $body,
        public readonly ?string $idempotencyKey = null,
        public readonly bool $previewUrl = false,
        public readonly ?string $replyTo = null,
        public readonly array $metadata = [],
    ) {}
}
