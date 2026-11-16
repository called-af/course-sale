<?php

namespace App\Services\WhatsApp\DTO;

class WhatsAppTemplateRequest
{
    public function __construct(
        public readonly string $to,
        public readonly string $name,
        public readonly string $language = 'id',
        public readonly array $parameters = [],
        public readonly array $components = [],
        public readonly ?string $idempotencyKey = null,
    ) {}
}
