<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class UserDeletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_soft_delete_user_with_enrollment(): void
    {
        /** @var User $admin */
        $admin = User::factory()->create(['role' => 'admin']);
        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);
        /** @var User $instructor */
        $instructor = User::factory()->create(['role' => 'instructor']);

        $course = Course::factory()->create(['creator_id' => $instructor->id]);
        $enrollment = Enrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        $this->actingAs($admin);

        $response = $this->delete(route('admin.users.destroy', $student));
        $response->assertRedirect();
        $response->assertSessionHas('success', 'User deleted');

        $this->assertSoftDeleted('users', [
            'id' => $student->id,
        ]);

        $this->assertNull(User::find($student->id));
        $this->assertNotNull(User::withTrashed()->find($student->id));

        // The enrollment is preserved and still has the user via withTrashed()
        $enrollmentFresh = Enrollment::find($enrollment->id);
        $this->assertNotNull($enrollmentFresh);
        $this->assertNotNull($enrollmentFresh->user);
        $this->assertSame($student->name, $enrollmentFresh->user->name);
    }

    public function test_admin_cannot_delete_themselves(): void
    {
        /** @var User $admin */
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin);

        $response = $this->delete(route('admin.users.destroy', $admin));
        $response->assertForbidden();

        $this->assertNotSoftDeleted('users', [
            'id' => $admin->id,
        ]);
    }

    public function test_non_admin_cannot_delete_users(): void
    {
        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);
        /** @var User $target */
        $target = User::factory()->create(['role' => 'student']);

        $this->actingAs($student);

        $response = $this->delete(route('admin.users.destroy', $target));
        $response->assertForbidden();

        $this->assertNotSoftDeleted('users', [
            'id' => $target->id,
        ]);
    }

    public function test_deleting_user_removes_active_sessions(): void
    {
        /** @var User $admin */
        $admin = User::factory()->create(['role' => 'admin']);
        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);

        DB::table('sessions')->insert([
            'id' => 'dummy_session_123',
            'user_id' => $student->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
            'payload' => 'payload',
            'last_activity' => time(),
        ]);

        $this->actingAs($admin);

        $this->delete(route('admin.users.destroy', $student));

        $this->assertDatabaseMissing('sessions', [
            'id' => 'dummy_session_123',
        ]);
    }
}
