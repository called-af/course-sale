<?php

namespace App\Services\AI;

use App\Services\AiSettings;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NvidiaService
{
    protected int $timeout;

    public function __construct(
        protected AiSettings $aiSettings,
    ) {
        $this->timeout = 30;
    }

    public function chat(array $messages, array $tools = [])
    {
        if (! $this->aiSettings->enabled() || ! $this->aiSettings->isConfigured()) {
            throw new Exception('Fitur AI belum aktif atau belum dikonfigurasi.');
        }

        $payload = [
            'model' => $this->aiSettings->model(),
            'messages' => $messages,
            'temperature' => 0.5,
            'max_tokens' => 1024,
            'stream' => false,
        ];

        if (! empty($tools)) {
            $payload['tools'] = $tools;
        }

        try {
            $startTime = microtime(true);
            $response = Http::withToken($this->aiSettings->apiKey())
                ->timeout($this->timeout)
                ->post($this->aiSettings->baseUrl().'/chat/completions', $payload);

            $executionTime = (microtime(true) - $startTime) * 1000;

            if ($response->failed()) {
                Log::error('NVIDIA API Error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new Exception('Gagal menghubungi layanan AI. Silakan coba lagi nanti.');
            }

            $responseData = $response->json();

            Log::info('NVIDIA Chat Response', [
                'model' => $this->aiSettings->model(),
                'response_time_ms' => round($executionTime),
                'status' => $response->status(),
                'usage' => $responseData['usage'] ?? null,
            ]);

            return $responseData;
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('NVIDIA Timeout/Connection Error', ['message' => $e->getMessage()]);
            throw new Exception('Koneksi ke layanan AI terputus. Silakan coba lagi nanti.');
        } catch (Exception $e) {
            Log::error('NVIDIA General Error', ['message' => $e->getMessage()]);
            throw new Exception($e->getMessage());
        }
    }
}
