<?php

namespace App\Services\WhatsApp\DTO;

class WhatsAppSendResult
{
    public function __construct(
        public readonly bool $success,
        public readonly ?string $messageId = null,
        public readonly string $status = 'unknown',
        public readonly ?string $error = null,
        public readonly ?string $errorCode = null,
        public readonly bool $retryable = false,
        public readonly array $raw = [],
        public readonly ?string $provider = null,
    ) {}

    public static function ok(?string $messageId, string $status = 'sent', array $raw = [], ?string $provider = null): self
    {
        return new self(true, $messageId, $status, null, null, false, $raw, $provider);
    }

    public static function failed(string $error, ?string $errorCode = null, bool $retryable = false, array $raw = [], ?string $provider = null): self
    {
        return new self(false, null, 'failed', $error, $errorCode, $retryable, $raw, $provider);
    }

    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'message_id' => $this->messageId,
            'status' => $this->status,
            'error' => $this->error,
            'error_code' => $this->errorCode,
            'retryable' => $this->retryable,
            'provider' => $this->provider,
            'response' => $this->raw,
        ];
    }
}
