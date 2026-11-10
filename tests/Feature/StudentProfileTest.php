<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_profile_page_renders_the_students_own_enrollments(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $course = Course::factory()->create([
            'type' => 'paid',
            'price' => 150000,
            'status' => 'published',
            'published_at' => now(),
        ]);
        Enrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        $this->actingAs($student)
            ->get('/student/profile')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('student/profile/page')
                ->where('user.enrollments.0.course.id', $course->id));
    }

    public function test_student_can_update_their_own_profile_without_conflicting_email(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        $this->actingAs($student)
            ->put('/student/profile', [
                'name' => 'Updated Student',
                'email' => $student->email,
                'password' => '',
            ])
            ->assertRedirect(route('student.profile'))
            ->assertSessionHas('success');

        $this->assertDatabaseHas('users', [
            'id' => $student->id,
            'name' => 'Updated Student',
            'email' => $student->email,
        ]);
    }

    public function test_student_cannot_escalate_their_role_through_the_profile_endpoint(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        $this->actingAs($student)
            ->put('/student/profile', [
                'name' => $student->name,
                'email' => $student->email,
                'role' => 'admin',
            ])
            ->assertRedirect(route('student.profile'));

        $this->assertDatabaseHas('users', [
            'id' => $student->id,
            'role' => 'student',
        ]);
    }
}
