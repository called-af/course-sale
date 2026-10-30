<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\Module;
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseDeletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_soft_delete_course_with_quizzes_and_modules(): void
    {
        /** @var User $admin */
        $admin = User::factory()->create(['role' => 'admin']);
        /** @var User $instructor */
        $instructor = User::factory()->create(['role' => 'instructor']);

        $course = Course::factory()->create([
            'creator_id' => $instructor->id,
            'title' => 'Test Flutter Course',
            'slug' => 'test-flutter-course',
        ]);

        $module = Module::create([
            'course_id' => $course->id,
            'title' => 'Module 1',
            'sort_order' => 1,
            'status' => 'published',
        ]);

        $material = Material::create([
            'module_id' => $module->id,
            'title' => 'Quiz Material',
            'description' => 'Test Quiz Material',
            'sort_order' => 1,
            'status' => 'published',
        ]);

        $content = MaterialContent::create([
            'material_id' => $material->id,
            'type' => 'quiz',
            'title' => 'Quiz 1',
            'duration' => 10,
            'sort_order' => 1,
            'status' => 'published',
        ]);

        QuizQuestion::create([
            'material_content_id' => $content->id,
            'question' => 'Sample question?',
            'explanation' => 'Sample explanation',
            'sort_order' => 1,
        ]);

        $this->actingAs($admin);

        $response = $this->delete(route('admin.courses.destroy', $course->slug));
        $response->assertRedirect(route('admin.courses.index'));
        $response->assertSessionHas('success', 'Course deleted successfully.');

        // Course should be soft deleted
        $this->assertSoftDeleted('courses', ['id' => $course->id]);
        $this->assertNull(Course::find($course->id));
        $this->assertNotNull(Course::withTrashed()->find($course->id));

        // Child records (modules, materials, contents, quiz questions) must be PRESERVED
        $this->assertDatabaseHas('modules', ['id' => $module->id]);
        $this->assertDatabaseHas('materials', ['id' => $material->id]);
        $this->assertDatabaseHas('material_contents', ['id' => $content->id]);
        $this->assertDatabaseHas('quiz_questions', ['material_content_id' => $content->id]);
    }

    public function test_force_deleting_course_with_enrollments_is_rejected(): void
    {
        /** @var User $instructor */
        $instructor = User::factory()->create(['role' => 'instructor']);
        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);

        $course = Course::factory()->create(['creator_id' => $instructor->id]);
        Enrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        $this->expectException(\DomainException::class);
        $course->forceDelete();
    }
}
