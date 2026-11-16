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
            throw new Exception('Fitur AI belum aktif atau belum dikonfigurasi.');
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

            throw new Exception('Gagal menghubungi layanan AI. Silakan coba lagi nanti.', 0, $exception);
        }
    }
}
