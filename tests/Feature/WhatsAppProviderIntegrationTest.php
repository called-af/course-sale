<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WhatsAppMessage;
use App\Models\WhatsAppProvider;
use App\Services\WhatsApp\DTO\WhatsAppMessageRequest;
use App\Services\WhatsApp\Manager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WhatsAppProviderIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_whatsapp_integration_page(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get(route('admin.integrations.whatsapp.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/integrations/WhatsApp')
                ->has('providers')
                ->has('catalog')
                ->has('drivers')
                ->has('global')
                ->has('stats')
                ->has('recent_messages'));
    }

    public function test_non_admin_cannot_access_whatsapp_integration_pages(): void
    {
        $user = User::factory()->create(['role' => 'instructor']);

        $this->actingAs($user);

        $this->get(route('admin.integrations.whatsapp.index'))->assertForbidden();
        $this->post(route('admin.integrations.whatsapp.store'), ['name' => 'Blocked'])->assertForbidden();
        $this->patch(route('admin.integrations.whatsapp.global'), ['enabled' => true])->assertForbidden();
    }

    public function test_admin_can_create_provider_and_credentials_are_encrypted(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.integrations.whatsapp.store'), [
            'name' => 'My Infobip',
            'preset' => 'infobip',
            'base_url' => 'https://1.1.1.1',
            'enabled' => true,
            'is_default' => true,
            'config' => ['from' => '447860088999', 'sandbox_keyword' => 'SANDBOX'],
            'credentials' => ['api_key' => 'infobip-secret-key-12345'],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $provider = WhatsAppProvider::query()->firstOrFail();
        $this->assertSame('My Infobip', $provider->name);
        $this->assertSame('infobip', $provider->driver);
        $this->assertTrue($provider->is_default);
        $this->assertSame('infobip-secret-key-12345', $provider->credential('api_key'));

        $raw = DB::table('whatsapp_provider_credentials')->where('key', 'api_key')->value('value');
        $this->assertNotSame('infobip-secret-key-12345', $raw);
        $this->assertStringNotContainsString('infobip-secret-key-12345', (string) $raw);

        $serialized = $provider->load('credentials')->credentials->first()->toArray();
        $this->assertArrayNotHasKey('value', $serialized);
    }

    public function test_provider_creation_rejects_ssrf_urls(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.integrations.whatsapp.store'), [
            'name' => 'Local Gateway',
            'preset' => 'custom',
            'base_url' => 'http://127.0.0.1:9000',
            'config' => ['send_path' => '/send'],
            'credentials' => ['api_key' => 'secret'],
        ]);

        $response->assertSessionHasErrors('base_url');
        $this->assertDatabaseCount('whatsapp_providers', 0);
    }

    public function test_manager_falls_back_on_retryable_failure_when_idempotency_key_is_present(): void
    {
        $this->infobipProvider('Primary', 'https://first-wa.example.test', true);
        $this->infobipProvider('Secondary', 'https://second-wa.example.test', false);

        Http::fake([
            'https://first-wa.example.test/whatsapp/1/message/text' => Http::response([
                'requestError' => ['serviceException' => ['text' => 'Temporary outage']],
            ], 503),
            'https://second-wa.example.test/whatsapp/1/message/text' => Http::response([
                'messageId' => 'fallback-message-1',
                'status' => ['groupName' => 'PENDING', 'name' => 'PENDING_ENROUTE'],
            ]),
        ]);

        $result = app(Manager::class)->sendText(
            new WhatsAppMessageRequest('628123456789', 'Hello', 'idempotency-1')
        );

        $this->assertTrue($result->success);
        $this->assertSame('fallback-message-1', $result->messageId);
        $this->assertSame('Secondary', $result->provider);

        Http::assertSent(fn ($request) => $request->url() === 'https://second-wa.example.test/whatsapp/1/message/text'
            && $request->hasHeader('X-Idempotency-Key', 'idempotency-1'));
    }

    public function test_manager_does_not_fall_back_without_idempotency_key(): void
    {
        $this->infobipProvider('Primary', 'https://first-wa.example.test', true);
        $this->infobipProvider('Secondary', 'https://second-wa.example.test', false);

        Http::fake([
            'https://first-wa.example.test/whatsapp/1/message/text' => Http::response([
                'requestError' => ['serviceException' => ['text' => 'Temporary outage']],
            ], 503),
            'https://second-wa.example.test/whatsapp/1/message/text' => Http::response([
                'messageId' => 'should-not-be-sent',
            ]),
        ]);

        $result = app(Manager::class)->sendText(
            new WhatsAppMessageRequest('628123456789', 'Hello')
        );

        $this->assertFalse($result->success);
        $this->assertTrue($result->retryable);
        Http::assertSentCount(1);
    }

    public function test_manager_falls_back_when_a_provider_is_misconfigured(): void
    {
        // Infobip provider without a sender number throws a configuration
        // exception before any HTTP request is dispatched.
        $this->infobipProvider('Misconfigured', 'https://misconfigured.example.test', true, from: '');

        $meta = $this->metaProvider();
        Http::fake([
            'https://graph.facebook.com/v21.0/123456/messages' => Http::response([
                'messages' => [['id' => 'meta-fallback-1']],
            ]),
        ]);

        $result = app(Manager::class)->sendText(
            new WhatsAppMessageRequest('628123456789', 'Hello')
        );

        $this->assertTrue($result->success);
        $this->assertSame('meta-fallback-1', $result->messageId);
        $this->assertSame($meta->name, $result->provider);
    }

    public function test_manager_falls_back_when_a_provider_lacks_a_capability(): void
    {
        $this->infobipProvider('Primary', 'https://first-wa.example.test', true);
        $meta = $this->metaProvider();

        Http::fake([
            'https://graph.facebook.com/v21.0/123456/messages' => Http::response([
                'messages' => [['id' => 'interactive-fallback-1']],
            ]),
        ]);

        $result = app(Manager::class)->sendInteractive(
            '628123456789',
            ['type' => 'button', 'body' => ['text' => 'Choose'], 'action' => ['buttons' => []]],
        );

        $this->assertTrue($result->success);
        $this->assertSame('interactive-fallback-1', $result->messageId);
        $this->assertSame($meta->name, $result->provider);
    }

    public function test_meta_webhook_verification_endpoint(): void
    {
        $provider = $this->metaProvider(['verify_token' => 'verify-secret']);

        $response = $this->get(route('webhooks.whatsapp.verify', [
            'provider' => $provider->slug,
            'hub_mode' => 'subscribe',
            'hub_verify_token' => 'verify-secret',
            'hub_challenge' => 'challenge-123',
        ]));

        $response->assertOk();
        $this->assertSame('challenge-123', $response->getContent());

        $this->get(route('webhooks.whatsapp.verify', [
            'provider' => $provider->slug,
            'hub_mode' => 'subscribe',
            'hub_verify_token' => 'wrong-token',
            'hub_challenge' => 'challenge-123',
        ]))->assertForbidden();
    }

    public function test_meta_webhook_persists_messages_and_status_updates(): void
    {
        $provider = $this->metaProvider();

        $outbound = WhatsAppMessage::create([
            'whatsapp_provider_id' => $provider->id,
            'direction' => 'outbound',
            'type' => 'text',
            'to' => '628123456789',
            'body' => 'Outbound',
            'provider_message_id' => 'wamid.OUT',
            'status' => 'sent',
        ]);

        $messagePayload = [
            'object' => 'whatsapp_business_account',
            'entry' => [[
                'id' => 'waba-1',
                'changes' => [[
                    'field' => 'messages',
                    'value' => [
                        'messaging_product' => 'whatsapp',
                        'metadata' => ['display_phone_number' => '15550001111', 'phone_number_id' => '123456'],
                        'contacts' => [['profile' => ['name' => 'Alice'], 'wa_id' => '628123456789']],
                        'messages' => [[
                            'from' => '628123456789',
                            'id' => 'wamid.IN',
                            'timestamp' => '1700000000',
                            'type' => 'text',
                            'text' => ['body' => 'Hello bot'],
                        ]],
                    ],
                ]],
            ]],
        ];

        $this->postJson(route('webhooks.whatsapp', $provider->slug), $messagePayload)
            ->assertOk()
            ->assertJson(['success' => true, 'event' => 'message']);

        $this->assertDatabaseHas('whatsapp_messages', [
            'whatsapp_provider_id' => $provider->id,
            'direction' => 'inbound',
            'provider_message_id' => 'wamid.IN',
            'body' => 'Hello bot',
            'status' => 'received',
        ]);

        $this->assertDatabaseHas('whatsapp_contacts', [
            'phone_number' => '628123456789',
            'name' => 'Alice',
        ]);

        $this->assertDatabaseHas('whatsapp_webhooks', [
            'whatsapp_provider_id' => $provider->id,
            'event' => 'message',
            'status' => 'processed',
        ]);

        $statusPayload = [
            'object' => 'whatsapp_business_account',
            'entry' => [[
                'id' => 'waba-1',
                'changes' => [[
                    'field' => 'messages',
                    'value' => [
                        'messaging_product' => 'whatsapp',
                        'metadata' => ['display_phone_number' => '15550001111', 'phone_number_id' => '123456'],
                        'statuses' => [[
                            'id' => 'wamid.OUT',
                            'recipient_id' => '628123456789',
                            'status' => 'delivered',
                            'timestamp' => '1700000001',
                        ]],
                    ],
                ]],
            ]],
        ];

        $this->postJson(route('webhooks.whatsapp', $provider->slug), $statusPayload)
            ->assertOk()
            ->assertJson(['success' => true, 'event' => 'status']);

        $this->assertSame('delivered', $outbound->fresh()->status);
        $this->assertNotNull($outbound->fresh()->delivered_at);
        $this->assertDatabaseHas('whatsapp_delivery_logs', [
            'whatsapp_message_id' => $outbound->id,
            'status' => 'delivered',
        ]);
    }

    public function test_meta_webhook_rejects_invalid_signatures(): void
    {
        $provider = $this->metaProvider(['app_secret' => 'webhook-secret']);

        $raw = json_encode([
            'object' => 'whatsapp_business_account',
            'entry' => [],
        ]);

        $this->call('POST', route('webhooks.whatsapp', $provider->slug), [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_HUB_SIGNATURE_256' => 'sha256=invalid',
        ], $raw)->assertForbidden();

        $validSignature = 'sha256='.hash_hmac('sha256', $raw, 'webhook-secret');

        $this->call('POST', route('webhooks.whatsapp', $provider->slug), [], [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_X_HUB_SIGNATURE_256' => $validSignature,
        ], $raw)->assertOk();
    }

    public function test_webhook_rejects_disabled_providers(): void
    {
        $provider = $this->metaProvider();
        $provider->forceFill(['enabled' => false])->save();

        $this->postJson(route('webhooks.whatsapp', $provider->slug), ['object' => 'whatsapp_business_account'])
            ->assertNotFound();
    }

    private function infobipProvider(
        string $name,
        string $baseUrl,
        bool $default,
        string $from = '447860088999',
    ): WhatsAppProvider {
        $provider = WhatsAppProvider::create([
            'name' => $name,
            'slug' => strtolower(str_replace(' ', '-', $name)),
            'driver' => 'infobip',
            'base_url' => $baseUrl,
            'config' => ['preset' => 'infobip', 'from' => $from],
            'enabled' => true,
            'is_default' => $default,
        ]);

        $provider->setCredential('api_key', 'infobip-key');

        return $provider;
    }

    private function metaProvider(array $credentials = []): WhatsAppProvider
    {
        static $counter = 0;
        $counter++;

        $provider = WhatsAppProvider::create([
            'name' => 'Meta '.$counter,
            'slug' => 'meta-test-'.$counter,
            'driver' => 'meta',
            'base_url' => 'https://graph.facebook.com',
            'config' => ['preset' => 'meta', 'phone_number_id' => '123456', 'api_version' => 'v21.0'],
            'enabled' => true,
            'is_default' => false,
        ]);

        $provider->setCredential('access_token', 'meta-token');

        foreach ($credentials as $key => $value) {
            $provider->setCredential($key, $value);
        }

        return $provider;
    }
}
