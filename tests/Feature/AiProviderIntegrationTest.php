<?php

namespace Tests\Feature;

use App\Models\AiModel;
use App\Models\AiProvider;
use App\Models\AiUsageLog;
use App\Models\User;
use App\Services\AI\DTO\AIRequest;
use App\Services\AI\Exceptions\ProviderException;
use App\Services\AI\Manager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AiProviderIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_ai_integration_page(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get(route('admin.integrations.ai.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/integrations/Ai')
                ->has('providers')
                ->has('catalog')
                ->has('drivers')
                ->has('global')
                ->has('recommendation')
                ->has('usage')
                ->has('recent_logs'));
    }

    public function test_non_admin_cannot_access_ai_integration_pages(): void
    {
        foreach (['instructor', 'student'] as $role) {
            $user = User::factory()->create(['role' => $role]);
            $this->actingAs($user);

            $this->get(route('admin.integrations.ai.index'))->assertForbidden();
            $this->post(route('admin.integrations.ai.store'), ['name' => 'Blocked'])->assertForbidden();
            $this->patch(route('admin.integrations.ai.global'), ['enabled' => true])->assertForbidden();
        }
    }

    public function test_admin_can_create_provider_and_credentials_are_encrypted(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.integrations.ai.store'), [
            'name' => 'My OpenAI',
            'preset' => 'openai',
            'base_url' => 'https://1.1.1.1/v1',
            'enabled' => true,
            'is_default' => true,
            'credentials' => ['api_key' => 'super-secret-key-12345'],
            'config' => ['organization' => 'org-1'],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $provider = AiProvider::query()->firstOrFail();
        $this->assertSame('My OpenAI', $provider->name);
        $this->assertTrue($provider->is_default);
        $this->assertSame('openai', $provider->driver);
        $this->assertSame('super-secret-key-12345', $provider->credential('api_key'));

        $raw = DB::table('ai_provider_credentials')->where('key', 'api_key')->value('value');
        $this->assertNotSame('super-secret-key-12345', $raw);
        $this->assertStringNotContainsString('super-secret-key-12345', (string) $raw);

        $serialized = $provider->load('credentials')->credentials->first()->toArray();
        $this->assertArrayNotHasKey('value', $serialized);
        $this->assertArrayNotHasKey('config', $provider->toArray());
    }

    public function test_provider_creation_rejects_ssrf_urls(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.integrations.ai.store'), [
            'name' => 'Local AI',
            'preset' => 'openai',
            'base_url' => 'http://127.0.0.1:11434/v1',
            'credentials' => ['api_key' => 'secret'],
        ]);

        $response->assertSessionHasErrors('base_url');
        $this->assertDatabaseCount('ai_providers', 0);
    }

    public function test_model_discovery_persists_models_and_restores_trashed_models(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $provider = $this->provider('Discovery Provider', 'https://models.example.test/v1');

        $trashed = AiModel::create([
            'ai_provider_id' => $provider->id,
            'model_id' => 'gpt-4o',
            'name' => 'Old GPT-4o',
            'capabilities' => ['text'],
            'is_default' => true,
        ]);
        $trashed->delete();

        Http::fake([
            'https://models.example.test/v1/models' => Http::response([
                'data' => [
                    ['id' => 'gpt-4o'],
                    ['id' => 'gpt-4o-mini'],
                ],
            ]),
        ]);

        $this->actingAs($admin)
            ->postJson(route('admin.integrations.ai.models.discover', $provider))
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('discovered', 2);

        $this->assertDatabaseHas('ai_models', [
            'ai_provider_id' => $provider->id,
            'model_id' => 'gpt-4o',
            'deleted_at' => null,
        ]);
        $this->assertSame(2, AiModel::query()->where('ai_provider_id', $provider->id)->count());
        $this->assertSame(1, AiModel::query()->where('ai_provider_id', $provider->id)->where('is_default', true)->count());
        $this->assertSame('connected', $provider->fresh()->status);
    }

    public function test_manager_falls_back_on_retryable_failure(): void
    {
        $this->provider('Primary', 'https://first.example.test/v1', default: true, priority: 1);
        $this->provider('Secondary', 'https://second.example.test/v1', default: false, priority: 2);

        Http::fake([
            'https://first.example.test/v1/chat/completions' => Http::response([
                'error' => ['message' => 'Provider is down'],
            ], 500),
            'https://second.example.test/v1/chat/completions' => Http::response($this->completion('Fallback works')),
        ]);

        $response = app(Manager::class)->generate(new AIRequest(
            messages: [['role' => 'user', 'content' => 'Hi']],
        ));

        $this->assertSame('Fallback works', $response->content);
        $this->assertSame('Secondary', $response->provider);
        $this->assertSame(1, AiUsageLog::query()->where('success', false)->count());
        $this->assertSame(1, AiUsageLog::query()->where('success', true)->count());
    }

    public function test_manager_does_not_fall_back_on_non_retryable_failure(): void
    {
        $this->provider('Primary', 'https://first.example.test/v1', default: true, priority: 1);
        $this->provider('Secondary', 'https://second.example.test/v1', default: false, priority: 2);

        Http::fake([
            'https://first.example.test/v1/chat/completions' => Http::response([
                'error' => ['message' => 'Invalid credentials'],
            ], 401),
            'https://second.example.test/v1/chat/completions' => Http::response($this->completion('Should not be used')),
        ]);

        try {
            app(Manager::class)->generate(new AIRequest(
                messages: [['role' => 'user', 'content' => 'Hi']],
            ));

            $this->fail('Expected a ProviderException for non-retryable failures.');
        } catch (ProviderException $exception) {
            $this->assertFalse($exception->retryable);
            $this->assertSame(401, $exception->statusCode);
        }

        Http::assertSentCount(1);
    }

    public function test_manager_falls_back_when_a_provider_is_misconfigured(): void
    {
        AiProvider::create([
            'name' => 'Misconfigured Bedrock',
            'slug' => 'misconfigured-bedrock',
            'driver' => 'bedrock',
            'base_url' => null,
            'config' => ['preset' => 'bedrock', 'region' => 'us-east-1', 'default_model' => 'anthropic.claude-3-5-sonnet-20240620-v1:0'],
            'enabled' => true,
            'is_default' => true,
            'fallback_priority' => 1,
        ]);

        $this->provider('Healthy', 'https://healthy.example.test/v1', default: false, priority: 2);

        Http::fake([
            'https://healthy.example.test/v1/chat/completions' => Http::response($this->completion('Configured provider works')),
        ]);

        $response = app(Manager::class)->generate(new AIRequest(
            messages: [['role' => 'user', 'content' => 'Hi']],
        ));

        $this->assertSame('Configured provider works', $response->content);
        $this->assertSame('Healthy', $response->provider);
    }

    private function provider(string $name, string $baseUrl, bool $default = false, int $priority = 100): AiProvider
    {
        $provider = AiProvider::create([
            'name' => $name,
            'slug' => strtolower(str_replace(' ', '-', $name)),
            'driver' => 'openai_compatible',
            'base_url' => $baseUrl,
            'config' => [
                'preset' => 'custom_openai',
                'default_model' => 'gpt-4o-mini',
            ],
            'enabled' => true,
            'is_default' => $default,
            'fallback_priority' => $priority,
        ]);

        $provider->setCredential('api_key', 'test-key');

        return $provider;
    }

    private function completion(string $content): array
    {
        return [
            'id' => 'chatcmpl-test',
            'model' => 'gpt-4o-mini',
            'choices' => [[
                'message' => ['role' => 'assistant', 'content' => $content],
                'finish_reason' => 'stop',
            ]],
            'usage' => ['prompt_tokens' => 5, 'completion_tokens' => 3, 'total_tokens' => 8],
        ];
    }
}
