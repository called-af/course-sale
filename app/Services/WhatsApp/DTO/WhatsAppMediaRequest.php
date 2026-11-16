<?php

namespace App\Services\WhatsApp\DTO;

class WhatsAppMediaRequest
{
    public function __construct(
        public readonly string $to,
        public readonly string $type,
        public readonly string $url,
        public readonly ?string $caption = null,
        public readonly ?string $filename = null,
        public readonly ?string $idempotencyKey = null,
        public readonly array $metadata = [],
    ) {}
}
