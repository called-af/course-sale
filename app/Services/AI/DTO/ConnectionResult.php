<?php

namespace App\Services\AI\DTO;

class ConnectionResult
{
    public function __construct(
        public readonly bool $success,
        public readonly string $message = '',
        public readonly ?int $latencyMs = null,
        public readonly array $metadata = [],
    ) {}

    public static function ok(string $message = 'Connection successful.', ?int $latencyMs = null, array $metadata = []): self
    {
        return new self(true, $message, $latencyMs, $metadata);
    }

    public static function failed(string $message, array $metadata = []): self
    {
        return new self(false, $message, null, $metadata);
    }

    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'message' => $this->message,
            'latency_ms' => $this->latencyMs,
            'metadata' => $this->metadata,
        ];
    }
}
