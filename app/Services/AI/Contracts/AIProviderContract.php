<?php

namespace App\Services\AI\Contracts;

use App\Services\AI\DTO\AIRequest;
use App\Services\AI\DTO\AIResponse;
use App\Services\AI\DTO\AIStreamChunk;
use App\Services\AI\DTO\ConnectionResult;

interface AIProviderContract
{
    public function name(): string;

    public function capabilities(): array;

    public function testConnection(): ConnectionResult;

    /**
     * @return array<int, array{id: string, name: string, capabilities: array, context_window: ?int, metadata: array}>
     */
    public function listModels(): array;

    public function generate(AIRequest $request): AIResponse;

    /**
     * @return iterable<AIStreamChunk>
     */
    public function stream(AIRequest $request): iterable;
}
