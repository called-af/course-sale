<?php

namespace App\Services\WhatsApp\DTO;

class WhatsAppMessageStatus
{
    public function __construct(
        public readonly string $messageId,
        public readonly string $status = 'unknown',
        public readonly ?string $recipient = null,
        public readonly ?string $description = null,
        public readonly array $raw = [],
    ) {}

    public function toArray(): array
    {
        return [
            'message_id' => $this->messageId,
            'status' => $this->status,
            'recipient' => $this->recipient,
            'description' => $this->description,
            'raw' => $this->raw,
        ];
    }
}
