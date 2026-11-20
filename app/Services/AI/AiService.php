<?php

namespace App\Services\AI;

use App\Services\AI\DTO\AIRequest;
use App\Services\AiSettings;
use Exception;
use Illuminate\Support\Facades\Log;

class AiService
{
    public function __construct(
        protected AiSettings $aiSettings,
        protected Manager $manager,
    ) {}

    /**
     * Send a chat completion request through the configured provider chain.
     *
     * The return value keeps the OpenAI-compatible shape expected by
     * AIOrchestrator, regardless of which provider actually handled it.
     */
    public function chat(array $messages, array $tools = [])
    {
        if (! $this->aiSettings->enabled() || ! $this->aiSettings->isConfigured()) {
            throw new Exception('The AI feature is not active or not configured.');
        }

        try {
            $response = $this->manager->generate(AIRequest::fromMessages($messages, [
                'tools' => $tools,
                'temperature' => 0.5,
                'max_tokens' => 1024,
            ]));

            return $response->toOpenAiShape();
        } catch (\App\Services\AI\Exceptions\ProviderException $exception) {
            Log::warning('AI provider request failed', [
                'provider' => $exception->provider,
                'status' => $exception->statusCode,
                'error_code' => $exception->errorCode,
            ]);

            throw new Exception('Failed to contact the AI service. Please try again later.', 0, $exception);
        }
    }
}
