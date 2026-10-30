<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use App\Services\CourseService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseEnrolledStudentsTest extends TestCase
{
    use RefreshDatabase;

    public function test_detail_data_excludes_soft_deleted_students_from_enrolled_students(): void
    {
        /** @var User $instructor */
        $instructor = User::factory()->create(['role' => 'instructor']);
        /** @var Course $course */
        $course = Course::factory()->create(['creator_id' => $instructor->id]);

        /** @var User $activeStudent1 */
        $activeStudent1 = User::factory()->create(['role' => 'student', 'name' => 'Active Student 1']);
        /** @var User $activeStudent2 */
        $activeStudent2 = User::factory()->create(['role' => 'student', 'name' => 'Active Student 2']);
        /** @var User $deletedStudent */
        $deletedStudent = User::factory()->create(['role' => 'student', 'name' => 'Deleted Student']);

        // Enroll all 3
        Enrollment::create([
            'user_id' => $activeStudent1->id,
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now()->subDays(2),
        ]);
        Enrollment::create([
            'user_id' => $activeStudent2->id,
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now()->subDay(),
        ]);
        Enrollment::create([
            'user_id' => $deletedStudent->id,
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        // Soft delete the deletedStudent
        $deletedStudent->delete();

        $service = app(CourseService::class);
        $data = $service->detailData($course);

        $enrolledStudents = $data['enrolled_students'];

        $this->assertCount(2, $enrolledStudents);
        $names = array_column($enrolledStudents, 'name');
        $this->assertContains('Active Student 1', $names);
        $this->assertContains('Active Student 2', $names);
        $this->assertNotContains('Deleted Student', $names);
    }
}
