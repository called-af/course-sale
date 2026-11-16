<?php

namespace App\Services\WhatsApp\DTO;

class NormalizedWebhookEvent
{
    /**
     * @param  array<int, array<string, mixed>>  $messages
     * @param  array<int, array<string, mixed>>  $statuses
     */
    public function __construct(
        public readonly string $provider,
        public readonly string $event = 'unknown',
        public readonly array $messages = [],
        public readonly array $statuses = [],
        public readonly array $raw = [],
    ) {}

    public function toArray(): array
    {
        return [
            'provider' => $this->provider,
            'event' => $this->event,
            'messages' => $this->messages,
            'statuses' => $this->statuses,
            'raw' => $this->raw,
        ];
    }
}
