<?php

namespace App\Services\AI\DTO;

class AIResponse
{
    /**
     * @param  array<int, array{id: string, type: string, function: array{name: string, arguments: string}}>  $toolCalls
     */
    public function __construct(
        public readonly string $content = '',
        public readonly array $toolCalls = [],
        public readonly array $usage = [],
        public readonly ?string $model = null,
        public readonly ?string $provider = null,
        public readonly ?string $finishReason = null,
        public readonly array $raw = [],
        public readonly ?string $providerMessageId = null,
    ) {}

    public function toOpenAiShape(): array
    {
        $message = ['role' => 'assistant', 'content' => $this->content];

        if ($this->toolCalls !== []) {
            $message['tool_calls'] = $this->toolCalls;
        }

        return [
            'id' => $this->providerMessageId,
            'model' => $this->model,
            'choices' => [[
                'index' => 0,
                'message' => $message,
                'finish_reason' => $this->finishReason,
            ]],
            'usage' => $this->usage,
            'provider' => $this->provider,
        ];
    }

    public function usageValue(string $key): int
    {
        return (int) ($this->usage[$key] ?? 0);
    }
}
