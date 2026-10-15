<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class InstructorSettingsAndWhatsAppTest extends TestCase
{
    use RefreshDatabase;

    public function test_instructor_can_access_settings_page(): void
    {
        /** @var User $instructor */
        $instructor = User::factory()->create([
            'role' => 'instructor',
            'whatsapp_number' => '6281234567890',
            'whatsapp_notification_enabled' => true,
        ]);

        $this->actingAs($instructor);

        $this->get(route('instructor.settings'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('instructor/settings/General')
                ->where('settings.whatsapp_number', '6281234567890')
                ->where('settings.whatsapp_notification_enabled', true)
                ->has('settings.is_configured')
                ->has('settings.is_local'));

        $this->get(route('instructor.settings.general'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('instructor/settings/General'));
    }

    public function test_instructor_can_access_profile_page(): void
    {
        /** @var User $instructor */
        $instructor = User::factory()->create([
            'role' => 'instructor',
            'name' => 'John Instructor',
            'email' => 'john@instructor.test',
        ]);

        $this->actingAs($instructor);

        $this->get(route('instructor.profile'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('instructor/Profile')
                ->where('user.id', $instructor->id)
                ->where('user.name', 'John Instructor'));

        // Settings profile alias redirects to profile
        $this->get(route('instructor.settings.profile'))
            ->assertRedirect(route('instructor.profile'));
    }

    public function test_instructor_can_update_profile(): void
    {
        /** @var User $instructor */
        $instructor = User::factory()->create([
            'role' => 'instructor',
            'name' => 'Original Name',
            'email' => 'original@test.com',
        ]);

        $this->actingAs($instructor);

        $response = $this->put(route('instructor.profile.update'), [
            'name' => 'Updated Name',
            'email' => 'updated@test.com',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'id' => $instructor->id,
            'name' => 'Updated Name',
            'email' => 'updated@test.com',
            'role' => 'instructor',
        ]);
    }

    public function test_instructor_can_update_whatsapp_settings_with_indonesian_number(): void
    {
        /** @var User $instructor */
        $instructor = User::factory()->create([
            'role' => 'instructor',
            'whatsapp_number' => null,
            'whatsapp_notification_enabled' => false,
        ]);

        $this->actingAs($instructor);

        // Submit local 08xxx number
        $response = $this->put(route('instructor.settings.whatsapp.update'), [
            'whatsapp_number' => '081234567890',
            'whatsapp_notification_enabled' => true,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        // Number should be normalized to international format (6281234567890)
        $this->assertDatabaseHas('users', [
            'id' => $instructor->id,
            'whatsapp_number' => '6281234567890',
            'whatsapp_notification_enabled' => 1,
        ]);
    }

    public function test_instructor_can_update_whatsapp_settings_with_plus_prefix_and_dashes(): void
    {
        /** @var User $instructor */
        $instructor = User::factory()->create([
            'role' => 'instructor',
        ]);

        $this->actingAs($instructor);

        $response = $this->put(route('instructor.settings.whatsapp.update'), [
            'whatsapp_number' => '+62 812-9876-5432',
            'whatsapp_notification_enabled' => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'id' => $instructor->id,
            'whatsapp_number' => '6281298765432',
            'whatsapp_notification_enabled' => 1,
        ]);
    }

    public function test_whatsapp_number_validation_fails_for_invalid_format(): void
    {
        /** @var User $instructor */
        $instructor = User::factory()->create(['role' => 'instructor']);
        $this->actingAs($instructor);

        $response = $this->put(route('instructor.settings.whatsapp.update'), [
            'whatsapp_number' => 'bukan-nomor-hp',
            'whatsapp_notification_enabled' => true,
        ]);

        $response->assertSessionHasErrors('whatsapp_number');
    }

    public function test_whatsapp_number_required_if_notification_enabled(): void
    {
        /** @var User $instructor */
        $instructor = User::factory()->create(['role' => 'instructor']);
        $this->actingAs($instructor);

        $response = $this->put(route('instructor.settings.whatsapp.update'), [
            'whatsapp_number' => '',
            'whatsapp_notification_enabled' => true,
        ]);

        $response->assertSessionHasErrors('whatsapp_number');
    }

    public function test_instructor_can_test_whatsapp_notification_successfully(): void
    {
        \Illuminate\Support\Facades\Http::fake([
            '*/whatsapp/1/message/text' => \Illuminate\Support\Facades\Http::response([
                'to' => '6281234567890',
                'messageCount' => 1,
                'messageId' => 'test-message-id-123',
                'status' => [
                    'groupId' => 1,
                    'groupName' => 'PENDING',
                    'id' => 7,
                    'name' => 'PENDING_ENROUTE',
                    'description' => 'Message sent to next instance',
                ],
            ], 200),
        ]);

        /** @var User $instructor */
        $instructor = User::factory()->create([
            'role' => 'instructor',
            'whatsapp_number' => null,
        ]);

        $this->actingAs($instructor);

        // Can test with a number supplied in request even if user has no saved number yet
        $response = $this->post(route('instructor.settings.whatsapp.test'), [
            'whatsapp_number' => '081234567890',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    public function test_test_whatsapp_notification_reports_infobip_sandbox_not_registered(): void
    {
        \Illuminate\Support\Facades\Http::fake([
            '*/whatsapp/1/message/text' => \Illuminate\Support\Facades\Http::response([
                'to' => '6281234567890',
                'messageCount' => 1,
                'messageId' => 'test-message-id-rejected',
                'status' => [
                    'groupId' => 5,
                    'groupName' => 'REJECTED',
                    'id' => 18,
                    'name' => 'REJECTED_DESTINATION_NOT_REGISTERED',
                    'description' => 'Destination not registered',
                ],
            ], 200),
        ]);

        /** @var User $instructor */
        $instructor = User::factory()->create(['role' => 'instructor']);
        $this->actingAs($instructor);

        $response = $this->post(route('instructor.settings.whatsapp.test'), [
            'whatsapp_number' => '081234567890',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
    }

    public function test_test_whatsapp_notification_fails_without_number(): void
    {
        /** @var User $instructor */
        $instructor = User::factory()->create([
            'role' => 'instructor',
            'whatsapp_number' => null,
        ]);

        $this->actingAs($instructor);

        $response = $this->post(route('instructor.settings.whatsapp.test'), [
            'whatsapp_number' => '',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
    }

    public function test_student_or_guest_cannot_access_instructor_settings(): void
    {
        // Guest
        $this->get(route('instructor.settings'))
            ->assertRedirect(route('login'));

        // Student
        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);
        $this->actingAs($student);

        $this->get(route('instructor.settings'))
            ->assertForbidden();

        $this->get(route('instructor.profile'))
            ->assertForbidden();
    }
}
