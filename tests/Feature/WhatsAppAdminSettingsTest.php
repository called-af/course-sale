<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WhatsAppSetting;
use App\Services\WhatsApp\WhatsAppService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WhatsAppAdminSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_whatsapp_settings_on_general_settings_page(): void
    {
        /** @var User $admin */
        $admin = User::factory()->create(['role' => 'admin']);

        WhatsAppSetting::current()->update([
            'enabled' => true,
            'provider' => 'infobip',
            'base_url' => 'https://custom.api.infobip.com',
            'from_number' => '447860088999',
            'sandbox_keyword' => 'CUSTOMKEYWORD',
            'api_key' => 'secret_infobip_key_12345',
        ]);

        $this->actingAs($admin);

        $this->get(route('admin.settings.general'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/settings/General')
                ->where('whatsapp.enabled', true)
                ->where('whatsapp.provider', 'infobip')
                ->where('whatsapp.base_url', 'https://custom.api.infobip.com')
                ->where('whatsapp.from_number', '447860088999')
                ->where('whatsapp.sandbox_keyword', 'CUSTOMKEYWORD')
                ->where('whatsapp.has_api_key', true)
                ->where('whatsapp.api_key_hint', '••••••••2345')
                ->where('whatsapp.is_configured', true));
    }

    public function test_admin_can_toggle_whatsapp_notifications(): void
    {
        /** @var User $admin */
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        // Turn off
        $response = $this->patch(route('admin.settings.whatsapp.toggle'), [
            'enabled' => false,
        ]);

        $response->assertRedirect();
        $this->assertFalse(WhatsAppSetting::current()->enabled);
        $this->assertFalse(app(WhatsAppService::class)->isEnabled());

        // Turn on
        $response = $this->patch(route('admin.settings.whatsapp.toggle'), [
            'enabled' => true,
        ]);

        $response->assertRedirect();
        $this->assertTrue(WhatsAppSetting::current()->enabled);
        $this->assertTrue(app(WhatsAppService::class)->isEnabled());
    }

    public function test_admin_can_update_infobip_credentials_with_valid_password(): void
    {
        /** @var User $admin */
        $admin = User::factory()->create([
            'role' => 'admin',
            'password' => bcrypt('password123'),
        ]);

        $this->actingAs($admin);

        $response = $this->put(route('admin.settings.whatsapp.update'), [
            'base_url' => 'https://new-tenant.api.infobip.com',
            'from_number' => '447860011223',
            'sandbox_keyword' => 'NEWKEYWORD',
            'api_key' => 'new_secret_api_key_67890',
            'current_password' => 'password123',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $setting = WhatsAppSetting::current();
        $this->assertSame('https://new-tenant.api.infobip.com', $setting->base_url);
        $this->assertSame('447860011223', $setting->from_number);
        $this->assertSame('NEWKEYWORD', $setting->sandbox_keyword);
        $this->assertSame('new_secret_api_key_67890', $setting->api_key);

        // Verify service dynamically reflects updated DB settings
        $service = app(WhatsAppService::class);
        $this->assertSame('https://new-tenant.api.infobip.com', $service->getBaseUrl());
        $this->assertSame('447860011223', $service->getSender());
        $this->assertSame('NEWKEYWORD', $service->getSandboxKeyword());
    }

    public function test_update_infobip_credentials_fails_with_invalid_password(): void
    {
        /** @var User $admin */
        $admin = User::factory()->create([
            'role' => 'admin',
            'password' => bcrypt('password123'),
        ]);

        $this->actingAs($admin);

        $response = $this->put(route('admin.settings.whatsapp.update'), [
            'base_url' => 'https://new-tenant.api.infobip.com',
            'from_number' => '447860011223',
            'api_key' => 'new_secret_api_key_67890',
            'current_password' => 'wrong-password',
        ]);

        $response->assertSessionHasErrors('current_password');
    }

    public function test_admin_can_send_test_whatsapp_notification_using_db_credentials(): void
    {
        Http::fake([
            'https://db-configured.api.infobip.com/whatsapp/1/message/text' => Http::response([
                'to' => '628987654321',
                'messageCount' => 1,
                'messageId' => 'infobip-db-test-msg-001',
                'status' => [
                    'groupId' => 1,
                    'groupName' => 'PENDING',
                    'id' => 7,
                    'name' => 'PENDING_ENROUTE',
                    'description' => 'Message sent to next instance',
                ],
            ], 200),
        ]);

        /** @var User $admin */
        $admin = User::factory()->create(['role' => 'admin']);

        // Set DB credentials
        WhatsAppSetting::current()->update([
            'enabled' => true,
            'base_url' => 'https://db-configured.api.infobip.com',
            'api_key' => 'db_api_key_live_prod',
            'from_number' => '447860099887',
            'sandbox_keyword' => 'DBSANDBOX',
        ]);
        app(WhatsAppService::class)->loadConfiguration();

        $this->actingAs($admin);

        $response = $this->postJson(route('admin.settings.whatsapp.test'), [
            'phone_number' => '08987654321',
        ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'message_id' => 'infobip-db-test-msg-001',
        ]);

        // Assert request was sent to the DB-configured URL with DB-configured Auth header and from number
        Http::assertSent(function ($request) {
            return str_starts_with($request->url(), 'https://db-configured.api.infobip.com')
                && $request->header('Authorization')[0] === 'App db_api_key_live_prod'
                && $request['from'] === '447860099887'
                && $request['to'] === '628987654321';
        });
    }

    public function test_non_admin_cannot_access_or_modify_whatsapp_settings(): void
    {
        /** @var User $instructor */
        $instructor = User::factory()->create(['role' => 'instructor']);
        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);

        // Instructor cannot access
        $this->actingAs($instructor);
        $this->get(route('admin.settings.general'))->assertForbidden();
        $this->patch(route('admin.settings.whatsapp.toggle'), ['enabled' => false])->assertForbidden();
        $this->put(route('admin.settings.whatsapp.update'), ['base_url' => 'https://evil.com'])->assertForbidden();
        $this->postJson(route('admin.settings.whatsapp.test'), ['phone_number' => '0812345'])->assertForbidden();

        // Student cannot access
        $this->actingAs($student);
        $this->get(route('admin.settings.general'))->assertForbidden();
        $this->patch(route('admin.settings.whatsapp.toggle'), ['enabled' => false])->assertForbidden();
        $this->put(route('admin.settings.whatsapp.update'), ['base_url' => 'https://evil.com'])->assertForbidden();
        $this->postJson(route('admin.settings.whatsapp.test'), ['phone_number' => '0812345'])->assertForbidden();
    }
}
