<?php

namespace Tests\Unit;

use App\Services\WhatsApp\AdapterConfig;
use App\Services\WhatsApp\Adapters\CustomWhatsAppAdapter;
use App\Services\WhatsApp\Adapters\FonnteWhatsAppAdapter;
use App\Services\WhatsApp\Adapters\InfobipWhatsAppAdapter;
use App\Services\WhatsApp\Adapters\MetaWhatsAppAdapter;
use App\Services\WhatsApp\DTO\WhatsAppMessageRequest;
use App\Services\WhatsApp\Exceptions\UnsupportedCapabilityException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WhatsAppAdaptersTest extends TestCase
{
    public function test_meta_adapter_sends_text_message(): void
    {
        Http::fake([
            'https://graph.facebook.com/v21.0/123456/messages' => Http::response([
                'messaging_product' => 'whatsapp',
                'contacts' => [['wa_id' => '628123456789', 'input' => '628123456789']],
                'messages' => [['id' => 'wamid.ABC123']],
            ]),
        ]);

        $adapter = new MetaWhatsAppAdapter($this->config('meta', 'https://graph.facebook.com', [
            'access_token' => 'meta-token',
        ], [
            'phone_number_id' => '123456',
            'api_version' => 'v21.0',
        ]));

        $result = $adapter->sendMessage(new WhatsAppMessageRequest('08123456789', 'Hello Meta'));

        $this->assertTrue($result->success);
        $this->assertSame('wamid.ABC123', $result->messageId);

        Http::assertSent(fn ($request) => $request->url() === 'https://graph.facebook.com/v21.0/123456/messages'
            && $request->hasHeader('Authorization', 'Bearer meta-token')
            && $request['to'] === '628123456789'
            && $request['type'] === 'text'
            && $request['text']['body'] === 'Hello Meta');
    }

    public function test_meta_adapter_requires_phone_number_id(): void
    {
        $adapter = new MetaWhatsAppAdapter($this->config('meta', 'https://graph.facebook.com', [
            'access_token' => 'meta-token',
        ]));

        $result = $adapter->sendMessage(new WhatsAppMessageRequest('628123456789', 'Hello'));

        $this->assertFalse($result->success);
        $this->assertSame('configuration_error', $result->errorCode);
        $this->assertStringContainsString('Phone Number ID', (string) $result->error);
    }

    public function test_infobip_adapter_sends_text_with_idempotency_header(): void
    {
        Http::fake([
            'https://tenant.api.infobip.com/whatsapp/1/message/text' => Http::response([
                'messageId' => 'infobip-msg-1',
                'status' => ['groupName' => 'PENDING', 'name' => 'PENDING_ENROUTE'],
            ]),
        ]);

        $adapter = new InfobipWhatsAppAdapter($this->config('infobip', 'https://tenant.api.infobip.com', [
            'api_key' => 'infobip-key',
        ], [
            'from' => '447860088999',
        ]));

        $result = $adapter->sendMessage(new WhatsAppMessageRequest('628123456789', 'Hello Infobip', 'idem-1'));

        $this->assertTrue($result->success);
        $this->assertSame('infobip-msg-1', $result->messageId);

        Http::assertSent(fn ($request) => $request->url() === 'https://tenant.api.infobip.com/whatsapp/1/message/text'
            && $request->hasHeader('Authorization', 'App infobip-key')
            && $request->hasHeader('X-Idempotency-Key', 'idem-1')
            && $request['from'] === '447860088999'
            && $request['content']['text'] === 'Hello Infobip');
    }

    public function test_fonnte_adapter_sends_text_message(): void
    {
        Http::fake([
            'https://api.fonnte.com/send' => Http::response([
                'status' => true,
                'id' => ['fonnte-msg-1'],
            ]),
        ]);

        $adapter = new FonnteWhatsAppAdapter($this->config('fonnte', 'https://api.fonnte.com', [
            'api_key' => 'fonnte-token',
        ], [
            'country_code' => '62',
        ]));

        $result = $adapter->sendMessage(new WhatsAppMessageRequest('08123456789', 'Hello Fonnte'));

        $this->assertTrue($result->success);
        $this->assertSame('fonnte-msg-1', $result->messageId);

        Http::assertSent(fn ($request) => $request->hasHeader('Authorization', 'fonnte-token')
            && $request['target'] === '628123456789'
            && $request['message'] === 'Hello Fonnte');
    }

    public function test_custom_adapter_uses_configured_field_names(): void
    {
        Http::fake([
            'https://gateway.example.test/send' => Http::response([
                'success' => true,
                'message_id' => 'custom-msg-1',
            ]),
        ]);

        $adapter = new CustomWhatsAppAdapter($this->config('custom', 'https://gateway.example.test', [
            'api_key' => 'custom-token',
        ], [
            'send_path' => '/send',
            'auth_header' => 'X-Api-Key',
            'auth_prefix' => '',
            'to_field' => 'phone',
            'message_field' => 'text',
            'from' => 'sender-1',
        ]));

        $result = $adapter->sendMessage(new WhatsAppMessageRequest('08123456789', 'Hello Custom'));

        $this->assertTrue($result->success);
        $this->assertSame('custom-msg-1', $result->messageId);

        Http::assertSent(fn ($request) => $request->hasHeader('X-Api-Key', 'custom-token')
            && $request['phone'] === '628123456789'
            && $request['text'] === 'Hello Custom'
            && $request['from'] === 'sender-1');
    }

    public function test_meta_adapter_parses_inbound_messages_and_statuses(): void
    {
        $adapter = new MetaWhatsAppAdapter($this->config('meta', 'https://graph.facebook.com'));

        $payload = [
            'object' => 'whatsapp_business_account',
            'entry' => [[
                'id' => 'waba-1',
                'changes' => [[
                    'field' => 'messages',
                    'value' => [
                        'messaging_product' => 'whatsapp',
                        'metadata' => ['display_phone_number' => '15550001111', 'phone_number_id' => '123'],
                        'contacts' => [['profile' => ['name' => 'Alice'], 'wa_id' => '628123456789']],
                        'messages' => [[
                            'from' => '628123456789',
                            'id' => 'wamid.IN',
                            'timestamp' => '1700000000',
                            'type' => 'text',
                            'text' => ['body' => 'Hello bot'],
                        ]],
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

        $event = $adapter->parseWebhook($payload, []);

        $this->assertSame('status', $event->event);
        $this->assertCount(1, $event->messages);
        $this->assertCount(1, $event->statuses);
        $this->assertSame('628123456789', $event->messages[0]['from']);
        $this->assertSame('Hello bot', $event->messages[0]['body']);
        $this->assertSame('Alice', $event->messages[0]['contact_name']);
        $this->assertSame('delivered', $event->statuses[0]['status']);
    }

    public function test_meta_adapter_verifies_webhook_hmac(): void
    {
        $adapter = new MetaWhatsAppAdapter($this->config('meta', 'https://graph.facebook.com', [
            'access_token' => 'meta-token',
            'app_secret' => 'app-secret',
        ]));

        $body = '{"object":"whatsapp_business_account"}';
        $signature = 'sha256='.hash_hmac('sha256', $body, 'app-secret');

        $this->assertTrue($adapter->verifyWebhook([], ['x-hub-signature-256' => [$signature]], $body));
        $this->assertFalse($adapter->verifyWebhook([], ['x-hub-signature-256' => ['sha256=invalid']], $body));
        $this->assertFalse($adapter->verifyWebhook([], [], $body));
    }

    public function test_infobip_adapter_parses_status_and_message_webhooks(): void
    {
        $adapter = new InfobipWhatsAppAdapter($this->config('infobip', 'https://tenant.api.infobip.com'));

        $statusEvent = $adapter->parseWebhook([
            'results' => [[
                'messageId' => 'infobip-out-1',
                'to' => '628123456789',
                'status' => ['groupName' => 'DELIVERED', 'name' => 'DELIVERED', 'description' => 'Delivered'],
            ]],
        ], []);

        $this->assertSame('status', $statusEvent->event);
        $this->assertSame('delivered', $statusEvent->statuses[0]['status']);

        $messageEvent = $adapter->parseWebhook([
            'results' => [[
                'messageId' => 'infobip-in-1',
                'from' => '628123456789',
                'to' => '447860088999',
                'message' => ['text' => 'Hello Infobip'],
            ]],
        ], []);

        $this->assertSame('message', $messageEvent->event);
        $this->assertSame('Hello Infobip', $messageEvent->messages[0]['body']);
    }

    public function test_fonnte_adapter_parses_inbound_message(): void
    {
        $adapter = new FonnteWhatsAppAdapter($this->config('fonnte', 'https://api.fonnte.com'));

        $event = $adapter->parseWebhook([
            'sender' => '08123456789',
            'message' => 'Hello Fonnte',
            'name' => 'Bob',
            'id' => 'fonnte-in-1',
        ], []);

        $this->assertSame('message', $event->event);
        $this->assertSame('628123456789', $event->messages[0]['from']);
        $this->assertSame('Hello Fonnte', $event->messages[0]['body']);
        $this->assertSame('Bob', $event->messages[0]['contact_name']);
    }

    public function test_unsupported_capabilities_throw(): void
    {
        $this->expectException(UnsupportedCapabilityException::class);

        $adapter = new FonnteWhatsAppAdapter($this->config('fonnte', 'https://api.fonnte.com'));

        $adapter->sendTemplate(new \App\Services\WhatsApp\DTO\WhatsAppTemplateRequest('628123456789', 'welcome'));
    }

    private function config(
        string $driver,
        ?string $baseUrl,
        array $credentials = [],
        array $config = [],
    ): AdapterConfig {
        return new AdapterConfig(
            providerId: null,
            name: 'Test WhatsApp',
            slug: 'test-whatsapp',
            driver: $driver,
            baseUrl: $baseUrl,
            credentials: $credentials,
            config: $config,
            timeout: 5,
            maxRetries: 0,
            capabilities: ['text'],
        );
    }
}
