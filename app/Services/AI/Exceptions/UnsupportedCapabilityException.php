<?php

namespace App\Services\AI\Exceptions;

class UnsupportedCapabilityException extends \RuntimeException
{
    public function __construct(string $provider, string $capability)
    {
        parent::__construct("Provider {$provider} tidak mendukung kapabilitas {$capability}.");
    }
}
