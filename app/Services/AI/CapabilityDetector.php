<?php

namespace App\Services\AI;

class CapabilityDetector
{
    public const ALL = [
        'text',
        'streaming',
        'vision',
        'tools',
        'structured_output',
        'json_mode',
        'embeddings',
        'audio_input',
        'audio_output',
        'image_generation',
    ];

    private const VISION_PATTERNS = [
        'gpt-4o', 'gpt-4.1', 'gpt-4-turbo', 'o1', 'o3', 'o4', 'claude-3', 'claude-4',
        'gemini', 'pixtral', 'llava', 'vision', 'qwen-vl', 'qwen2-vl', 'grok-vision',
        'llama-3.2', 'llama-4', 'mistral-small-3',
    ];

    private const TOOL_PATTERNS = [
        'gpt-4', 'gpt-3.5', 'gpt-5', 'o1', 'o3', 'o4', 'claude', 'gemini', 'mistral',
        'llama-3.1', 'llama-3.3', 'llama-4', 'command-r', 'deepseek', 'grok', 'qwen',
        'jamba', 'firefunction', 'hermes',
    ];

    private const JSON_PATTERNS = [
        'gpt-4o', 'gpt-4.1', 'gpt-4-turbo', 'gemini', 'mistral', 'deepseek', 'llama-3',
        'command-r', 'grok', 'qwen',
    ];

    private const EMBEDDING_PATTERNS = ['embed', 'embedding', 'bge-', 'e5-', 'voyage'];

    private const IMAGE_PATTERNS = ['dall-e', 'stable-diffusion', 'flux', 'imagen', 'sdxl'];

    private const AUDIO_INPUT_PATTERNS = ['whisper', 'audio', 'realtime'];

    private const AUDIO_OUTPUT_PATTERNS = ['tts', 'speech'];

    /**
     * Infer model capabilities from the model identifier. Provider-level
     * capabilities act as the upper bound: we never claim a capability the
     * adapter/catalog does not support.
     */
    public static function detect(string $modelId, array $providerCapabilities = []): array
    {
        $id = strtolower($modelId);
        $capabilities = ['text'];

        $checks = [
            'vision' => self::VISION_PATTERNS,
            'tools' => self::TOOL_PATTERNS,
            'json_mode' => self::JSON_PATTERNS,
            'embeddings' => self::EMBEDDING_PATTERNS,
            'image_generation' => self::IMAGE_PATTERNS,
            'audio_input' => self::AUDIO_INPUT_PATTERNS,
            'audio_output' => self::AUDIO_OUTPUT_PATTERNS,
        ];

        foreach ($checks as $capability => $patterns) {
            foreach ($patterns as $pattern) {
                if (str_contains($id, $pattern)) {
                    $capabilities[] = $capability;
                    break;
                }
            }
        }

        if (str_contains($id, 'embed') || str_contains($id, 'embedding')) {
            $capabilities = array_values(array_diff($capabilities, ['text']));
        }

        if ($providerCapabilities !== []) {
            $capabilities = array_values(array_intersect($capabilities, $providerCapabilities));
            if ($capabilities === []) {
                $capabilities = ['text'];
            }
        }

        return array_values(array_unique($capabilities));
    }

    public static function contextWindow(string $modelId): ?int
    {
        $id = strtolower($modelId);

        return match (true) {
            str_contains($id, 'gemini-1.5'), str_contains($id, 'gemini-2') => 1_000_000,
            str_contains($id, 'claude') => 200_000,
            str_contains($id, 'gpt-4o'), str_contains($id, 'gpt-4.1'), str_contains($id, 'gpt-5') => 128_000,
            str_contains($id, 'gpt-4-turbo') => 128_000,
            str_contains($id, 'gpt-3.5') => 16_385,
            str_contains($id, 'llama-3'), str_contains($id, 'llama-4') => 128_000,
            str_contains($id, 'mistral-large') => 128_000,
            str_contains($id, 'deepseek') => 64_000,
            str_contains($id, 'command-r') => 128_000,
            str_contains($id, 'qwen') => 128_000,
            default => null,
        };
    }
}
