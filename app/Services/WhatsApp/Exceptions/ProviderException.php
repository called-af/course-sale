<?php

namespace App\Services\WhatsApp\Exceptions;

use RuntimeException;

class ProviderException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly ?string $provider = null,
        public readonly ?int $statusCode = null,
        public readonly bool $retryable = false,
        public readonly ?string $errorCode = null,
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, $statusCode ?? 0, $previous);
    }

    public static function configuration(string $provider, string $message): self
    {
        return new self($message, $provider, null, false, 'configuration_error');
    }

    public static function fromResponse(string $provider, int $status, ?string $body = null): self
    {
        $message = match (true) {
            $status === 401 || $status === 403 => 'WhatsApp credentials were rejected.',
            $status === 404 => 'Endpoint or resource not found.',
            $status === 429 => 'Rate limit provider tercapai.',
            $status >= 500 => 'The provider is experiencing issues.',
            default => 'The request to the WhatsApp provider failed.',
        };

        if ($body) {
            $decoded = json_decode($body, true);
            $detail = data_get($decoded, 'error.message')
                ?? data_get($decoded, 'message')
                ?? data_get($decoded, 'reason')
                ?? data_get($decoded, 'requestError.serviceException.text')
                ?? null;

            if (is_string($detail) && $detail !== '') {
                $message .= ' '.mb_substr($detail, 0, 300);
            }
        }

        $retryable = $status === 408 || $status === 429 || $status >= 500;

        return new self($message, $provider, $status, $retryable, (string) $status);
    }
}
