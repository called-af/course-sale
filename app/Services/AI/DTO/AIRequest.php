<?php

namespace App\Services\AI\DTO;

class AIRequest
{
    public function __construct(
        public array $messages = [],
        public ?string $model = null,
        public ?string $system = null,
        public float $temperature = 0.5,
        public int $maxTokens = 1024,
        public array $tools = [],
        public bool $stream = false,
        public array $extra = [],
        public ?int $userId = null,
    ) {}

    public static function fromMessages(array $messages, array $options = []): self
    {
        return new self(
            messages: $messages,
            model: $options['model'] ?? null,
            system: $options['system'] ?? null,
            temperature: (float) ($options['temperature'] ?? 0.5),
            maxTokens: (int) ($options['max_tokens'] ?? 1024),
            tools: $options['tools'] ?? [],
            stream: (bool) ($options['stream'] ?? false),
            extra: $options['extra'] ?? [],
            userId: $options['user_id'] ?? null,
        );
    }

    public function withModel(?string $model): self
    {
        $clone = clone $this;
        $clone->model = $model;

        return $clone;
    }

    public function withStream(bool $stream): self
    {
        $clone = clone $this;
        $clone->stream = $stream;

        return $clone;
    }
}
