<?php

namespace App\Services\AI\Exceptions;

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

    public static function fromResponse(string $provider, int $status, ?string $body = null, ?string $errorCode = null): self
    {
        $message = match (true) {
            $status === 401 || $status === 403 => 'Provider credentials were rejected.',
            $status === 404 => 'Endpoint or model not found.',
            $status === 429 => 'Rate limit provider tercapai.',
            $status >= 500 => 'The provider is experiencing issues.',
            default => 'The request to the provider failed.',
        };

        if ($body) {
            $decoded = json_decode($body, true);
            $detail = data_get($decoded, 'error.message')
                ?? data_get($decoded, 'message')
                ?? data_get($decoded, 'error')
                ?? null;

            if (is_string($detail) && $detail !== '') {
                $message .= ' '.mb_substr($detail, 0, 300);
            }
        }

        $retryable = $status === 408 || $status === 409 || $status === 425 || $status === 429 || $status >= 500;

        return new self($message, $provider, $status, $retryable, $errorCode ?? (string) $status);
    }

    public static function configuration(string $provider, string $message): self
    {
        return new self($message, $provider, null, false, 'configuration_error');
    }
}
