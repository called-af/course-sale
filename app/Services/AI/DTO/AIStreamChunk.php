<?php

namespace App\Services\AI\DTO;

class AIStreamChunk
{
    public function __construct(
        public readonly string $delta = '',
        public readonly bool $done = false,
        public readonly array $raw = [],
        public readonly array $toolCalls = [],
    ) {}
}
