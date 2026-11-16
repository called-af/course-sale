<?php

namespace Tests\Unit;

use App\Services\AI\AdapterConfig;
use App\Services\AI\Adapters\AnthropicAdapter;
use App\Services\AI\Adapters\AzureOpenAiAdapter;
use App\Services\AI\Adapters\BedrockAdapter;
use App\Services\AI\Adapters\CloudflareAdapter;
use App\Services\AI\Adapters\CohereAdapter;
use App\Services\AI\Adapters\GeminiAdapter;
use App\Services\AI\Adapters\OpenAiCompatibleAdapter;
use App\Services\AI\Adapters\ReplicateAdapter;
use App\Services\AI\DTO\AIRequest;
use App\Services\AI\Registry;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AiAdaptersTest extends TestCase
{
    public function test_registry_resolves_every_catalog_driver(): void
    {
        $registry = app(Registry::class);

        foreach (array_keys(config('ai_providers.drivers')) as $driver) {
            $this->assertContains($driver, $registry->drivers());
        }
    }

    public function test_openai_compatible_adapter_generates_and_lists_models(): void
    {
        Http::fake([
            'https://ai.example.test/v1/models' => Http::response([
                'data' => [
                    ['id' => 'gpt-4o', 'object' => 'model'],
                    ['id' => 'text-embedding-3-small', 'object' => 'model'],
                ],
            ]),
            'https://ai.example.test/v1/chat/completions' => Http::response([
                'id' => 'chatcmpl-1',
                'model' => 'gpt-4o-mini',
                'choices' => [[
                    'message' => ['role' => 'assistant', 'content' => 'Hello from OpenAI'],
                    'finish_reason' => 'stop',
                ]],
                'usage' => ['prompt_tokens' => 10, 'completion_tokens' => 4, 'total_tokens' => 14],
            ]),
        ]);

        $adapter = new OpenAiCompatibleAdapter($this->config('openai_compatible', 'https://ai.example.test/v1'));

        $models = $adapter->listModels();
        $this->assertSame('gpt-4o', $models[0]['id']);
        $this->assertContains('vision', $models[0]['capabilities']);
        $this->assertContains('embeddings', $models[1]['capabilities']);

        $response = $adapter->generate(new AIRequest(
            messages: [['role' => 'user', 'content' => 'Hi']],
            model: 'gpt-4o-mini',
        ));

        $this->assertSame('Hello from OpenAI', $response->content);
        $this->assertSame(14, $response->usageValue('total_tokens'));
        $this->assertSame('gpt-4o-mini', $response->model);
        $this->assertSame('chatcmpl-1', $response->providerMessageId);

        Http::assertSent(fn ($request) => $request->url() === 'https://ai.example.test/v1/chat/completions'
            && $request->hasHeader('Authorization', 'Bearer test-key')
            && $request['model'] === 'gpt-4o-mini');
    }

    public function test_anthropic_adapter_generates_content(): void
    {
        Http::fake([
            'https://api.anthropic.com/v1/messages' => Http::response([
                'id' => 'msg_1',
                'model' => 'claude-3-5-sonnet',
                'content' => [
                    ['type' => 'text', 'text' => 'Hello from Claude'],
                ],
                'usage' => ['input_tokens' => 12, 'output_tokens' => 5],
                'stop_reason' => 'end_turn',
            ]),
        ]);

        $adapter = new AnthropicAdapter($this->config('anthropic', 'https://api.anthropic.com/v1'));

        $response = $adapter->generate(new AIRequest(
            messages: [['role' => 'user', 'content' => 'Hi']],
            model: 'claude-3-5-sonnet',
        ));

        $this->assertSame('Hello from Claude', $response->content);
        $this->assertSame(17, $response->usageValue('total_tokens'));
        $this->assertSame('end_turn', $response->finishReason);

        Http::assertSent(fn ($request) => $request->hasHeader('x-api-key', 'test-key')
            && $request->hasHeader('anthropic-version', '2023-06-01'));
    }

    public function test_gemini_adapter_generates_content(): void
    {
        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [[
                    'content' => ['parts' => [['text' => 'Hello from Gemini']]],
                    'finishReason' => 'STOP',
                ]],
                'usageMetadata' => [
                    'promptTokenCount' => 8,
                    'candidatesTokenCount' => 3,
                    'totalTokenCount' => 11,
                ],
            ]),
        ]);

        $adapter = new GeminiAdapter($this->config('gemini', 'https://generativelanguage.googleapis.com/v1beta'));

        $response = $adapter->generate(new AIRequest(
            messages: [['role' => 'user', 'content' => 'Hi']],
            model: 'gemini-2.0-flash',
        ));

        $this->assertSame('Hello from Gemini', $response->content);
        $this->assertSame(11, $response->usageValue('total_tokens'));

        Http::assertSent(fn ($request) => str_contains($request->url(), '/models/gemini-2.0-flash:generateContent')
            && $request->hasHeader('x-goog-api-key', 'test-key'));
    }

    public function test_cohere_adapter_generates_content(): void
    {
        Http::fake([
            'https://api.cohere.com/v2/chat' => Http::response([
                'message' => ['content' => [['type' => 'text', 'text' => 'Hello from Cohere']]],
                'usage' => ['tokens' => ['input_tokens' => 6, 'output_tokens' => 2]],
            ]),
        ]);

        $adapter = new CohereAdapter($this->config('cohere', 'https://api.cohere.com/v2'));

        $response = $adapter->generate(new AIRequest(
            messages: [['role' => 'user', 'content' => 'Hi']],
            model: 'command-r-plus',
        ));

        $this->assertSame('Hello from Cohere', $response->content);
        $this->assertSame(8, $response->usageValue('total_tokens'));
    }

    public function test_azure_adapter_uses_deployment_url_and_api_key_header(): void
    {
        Http::fake([
            'https://resource.openai.azure.com/*' => Http::response([
                'choices' => [[
                    'message' => ['role' => 'assistant', 'content' => 'Hello from Azure'],
                    'finish_reason' => 'stop',
                ]],
                'usage' => ['prompt_tokens' => 4, 'completion_tokens' => 2, 'total_tokens' => 6],
            ]),
        ]);

        $adapter = new AzureOpenAiAdapter($this->config(
            'azure_openai',
            'https://resource.openai.azure.com',
            ['deployment' => 'my-deployment', 'api_version' => '2024-10-21'],
            'my-deployment',
        ));

        $response = $adapter->generate(new AIRequest(
            messages: [['role' => 'user', 'content' => 'Hi']],
        ));

        $this->assertSame('Hello from Azure', $response->content);

        Http::assertSent(fn ($request) => str_contains($request->url(), '/openai/deployments/my-deployment/chat/completions')
            && str_contains($request->url(), 'api-version=2024-10-21')
            && $request->hasHeader('api-key', 'test-key'));
    }

    public function test_replicate_adapter_generates_content(): void
    {
        Http::fake([
            'https://api.replicate.com/v1/models/*' => Http::response([
                'id' => 'prediction-1',
                'status' => 'succeeded',
                'output' => 'Hello from Replicate',
            ]),
        ]);

        $adapter = new ReplicateAdapter($this->config(
            'replicate',
            'https://api.replicate.com/v1',
            [],
            'meta/meta-llama-3-70b-instruct',
        ));

        $response = $adapter->generate(new AIRequest(
            messages: [['role' => 'user', 'content' => 'Hi']],
        ));

        $this->assertSame('Hello from Replicate', $response->content);
        $this->assertSame('prediction-1', $response->providerMessageId);
    }

    public function test_cloudflare_adapter_generates_content(): void
    {
        Http::fake([
            'https://api.cloudflare.com/client/v4/accounts/acc-123/ai/run/*' => Http::response([
                'result' => ['response' => 'Hello from Cloudflare'],
                'success' => true,
            ]),
        ]);

        $adapter = new CloudflareAdapter($this->config(
            'cloudflare',
            'https://api.cloudflare.com/client/v4',
            ['account_id' => 'acc-123'],
            '@cf/meta/llama-3.1-8b-instruct',
        ));

        $response = $adapter->generate(new AIRequest(
            messages: [['role' => 'user', 'content' => 'Hi']],
        ));

        $this->assertSame('Hello from Cloudflare', $response->content);
    }

    public function test_bedrock_adapter_signs_requests(): void
    {
        Http::fake([
            'https://bedrock-runtime.us-east-1.amazonaws.com/*' => Http::response([
                'output' => ['message' => ['content' => [['text' => 'Hello from Bedrock']]]],
                'stopReason' => 'end_turn',
                'usage' => ['inputTokens' => 5, 'outputTokens' => 3, 'totalTokens' => 8],
            ]),
        ]);

        $adapter = new BedrockAdapter($this->config(
            'bedrock',
            null,
            ['region' => 'us-east-1'],
            'anthropic.claude-3-5-sonnet-20240620-v1:0',
            [
                'access_key_id' => 'AKIAEXAMPLE',
                'secret_access_key' => 'secret',
            ],
        ));

        $response = $adapter->generate(new AIRequest(
            messages: [['role' => 'user', 'content' => 'Hi']],
        ));

        $this->assertSame('Hello from Bedrock', $response->content);

        Http::assertSent(fn ($request) => str_starts_with($request->url(), 'https://bedrock-runtime.us-east-1.amazonaws.com/model/')
            && str_contains((string) $request->header('Authorization')[0], 'AWS4-HMAC-SHA256'));
    }

    private function config(
        string $driver,
        ?string $baseUrl,
        array $config = [],
        ?string $defaultModel = 'test-model',
        array $credentials = ['api_key' => 'test-key'],
    ): AdapterConfig {
        return new AdapterConfig(
            providerId: null,
            name: 'Test Provider',
            slug: 'test-provider',
            driver: $driver,
            baseUrl: $baseUrl,
            credentials: $credentials,
            config: $config,
            timeout: 5,
            maxRetries: 0,
            defaultModel: $defaultModel,
            capabilities: ['text', 'streaming', 'vision', 'tools', 'json_mode', 'embeddings'],
        );
    }
}
