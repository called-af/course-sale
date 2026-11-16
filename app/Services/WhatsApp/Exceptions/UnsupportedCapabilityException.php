<?php

namespace App\Services\WhatsApp\Exceptions;

class UnsupportedCapabilityException extends \RuntimeException
{
    public function __construct(string $provider, string $capability)
    {
        parent::__construct("Provider {$provider} tidak mendukung fitur {$capability}.");
    }
}
