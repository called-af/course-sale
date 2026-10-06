<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Exception;
use Illuminate\Support\Facades\Log;

class NvidiaService
{
    protected string $baseUrl;
    protected string $apiKey;
    protected string $model;
    protected int $timeout;

    public function __construct()
    {
        $this->baseUrl = config('services.nvidia.base_url', 'https://integrate.api.nvidia.com/v1');
        $this->apiKey = config('services.nvidia.api_key', '');
        $this->model = config('services.nvidia.model', 'meta/llama3-70b-instruct');
        $this->timeout = 30; // seconds

        if (empty($this->apiKey)) {
            throw new \RuntimeException('NVIDIA API key is not configured. Please set NVIDIA_API_KEY in your .env file.');
        }
    }

    public function chat(array $messages, array $tools = [])
    {
        $payload = [
            'model' => $this->model,
            'messages' => $messages,
            'temperature' => 0.5,
            'max_tokens' => 1024,
            'stream' => false,
        ];

        if (!empty($tools)) {
            $payload['tools'] = $tools;
        }

        try {
            $startTime = microtime(true);
            $response = Http::withToken($this->apiKey)
                ->timeout($this->timeout)
                ->post($this->baseUrl . '/chat/completions', $payload);
            
            $executionTime = (microtime(true) - $startTime) * 1000;

            if ($response->failed()) {
                Log::error('NVIDIA API Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new Exception('Gagal menghubungi layanan AI. Silakan coba lagi nanti.');
            }

            $responseData = $response->json();
            
            Log::info('NVIDIA Chat Response', [
                'model' => $this->model,
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
