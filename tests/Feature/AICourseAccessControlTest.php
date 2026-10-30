<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Material;
use App\Models\Module;
use App\Models\Review;
use App\Models\User;
use App\Services\AI\Tool\CourseDetailTool;
use App\Services\AI\Tool\InstructorAnalyticsTool;
use App\Services\AI\Tool\InstructorStudentTool;
use App\Services\AI\Tool\UserProgressTool;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AICourseAccessControlTest extends TestCase
{
    use RefreshDatabase;

    public function test_unenrolled_student_can_only_see_module_count_and_no_materials(): void
    {
        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);
        /** @var User $instructor */
        $instructor = User::factory()->create(['role' => 'instructor']);

        /** @var Course $course */
        $course = Course::factory()->create([
            'creator_id' => $instructor->id,
            'title' => 'Vue.js Mastery',
            'status' => 'published',
        ]);

        $module1 = Module::factory()->create(['course_id' => $course->id, 'title' => 'Pengenalan Vue', 'sort_order' => 1]);
        $module2 = Module::factory()->create(['course_id' => $course->id, 'title' => 'Reactivity System', 'sort_order' => 2]);

        Material::factory()->create(['module_id' => $module1->id, 'title' => 'Instalasi Vue', 'description' => 'Materi rahasia modul 1']);
        Material::factory()->create(['module_id' => $module2->id, 'title' => 'Ref vs Reactive', 'description' => 'Materi rahasia modul 2']);

        $tool = new CourseDetailTool;
        $tool->setUserId($student->id);

        $result = $tool->execute(['course_id' => $course->id]);

        $this->assertFalse($result['is_enrolled']);
        $this->assertFalse($result['has_full_access']);
        $this->assertTrue($result['access_restricted']);
        $this->assertSame(2, $result['modules_count']);
        $this->assertNull($result['materials']);
        $this->assertStringContainsString('User belum enroll di course ini', $result['access_message']);
        $this->assertStringContainsString('2 modul', $result['access_message']);

        // Module list for unenrolled only contains module titles, not the internal materials
        $this->assertEquals(['Pengenalan Vue', 'Reactivity System'], $result['modules']);
    }

    public function test_enrolled_student_can_access_all_modules_and_materials(): void
    {
        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);
        /** @var User $instructor */
        $instructor = User::factory()->create(['role' => 'instructor']);

        /** @var Course $course */
        $course = Course::factory()->create([
            'creator_id' => $instructor->id,
            'title' => 'Vue.js Mastery',
            'status' => 'published',
        ]);

        $module1 = Module::factory()->create(['course_id' => $course->id, 'title' => 'Pengenalan Vue', 'sort_order' => 1]);
        $material1 = Material::factory()->create(['module_id' => $module1->id, 'title' => 'Instalasi Vue', 'description' => 'Langkah instalasi']);

        // Student enrolls in the course
        Enrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        $tool = new CourseDetailTool;
        $tool->setUserId($student->id);

        $result = $tool->execute(['course_id' => $course->id]);

        $this->assertTrue($result['is_enrolled']);
        $this->assertTrue($result['has_full_access']);
        $this->assertSame(1, $result['modules_count']);

        // Must include full module and material details
        $this->assertCount(1, $result['modules']);
        $this->assertSame('Pengenalan Vue', $result['modules'][0]['title']);
        $this->assertCount(1, $result['modules'][0]['materials']);
        $this->assertSame('Instalasi Vue', $result['modules'][0]['materials'][0]['title']);
        $this->assertSame('Langkah instalasi', $result['modules'][0]['materials'][0]['description']);
    }

    public function test_course_creator_instructor_has_full_access_to_own_course_materials(): void
    {
        /** @var User $instructor */
        $instructor = User::factory()->create(['role' => 'instructor']);

        /** @var Course $course */
        $course = Course::factory()->create([
            'creator_id' => $instructor->id,
            'title' => 'Advanced PHP Design Patterns',
            'status' => 'published',
        ]);

        $module = Module::factory()->create(['course_id' => $course->id, 'title' => 'Creational Patterns', 'sort_order' => 1]);
        Material::factory()->create(['module_id' => $module->id, 'title' => 'Factory Pattern', 'description' => 'Belajar Factory']);

        $tool = new CourseDetailTool;
        $tool->setUserId($instructor->id);

        $result = $tool->execute(['course_id' => $course->id]);

        $this->assertTrue($result['is_owner']);
        $this->assertTrue($result['has_full_access']);
        $this->assertSame('Factory Pattern', $result['modules'][0]['materials'][0]['title']);
    }

    public function test_instructor_cannot_view_materials_of_other_instructor_course_unless_enrolled(): void
    {
        /** @var User $instructor1 */
        $instructor1 = User::factory()->create(['role' => 'instructor']);
        /** @var User $instructor2 */
        $instructor2 = User::factory()->create(['role' => 'instructor']);

        /** @var Course $course */
        $course = Course::factory()->create([
            'creator_id' => $instructor2->id,
            'title' => 'Other Instructor Course',
            'status' => 'published',
        ]);

        Module::factory()->create(['course_id' => $course->id, 'title' => 'Modul 1']);

        $tool = new CourseDetailTool;
        $tool->setUserId($instructor1->id);

        $result = $tool->execute(['course_id' => $course->id]);

        $this->assertFalse($result['is_owner']);
        $this->assertFalse($result['is_enrolled']);
        $this->assertFalse($result['has_full_access']);
        $this->assertTrue($result['access_restricted']);
        $this->assertNull($result['materials']);
    }

    public function test_instructor_can_view_own_courses_via_instructor_tool(): void
    {
        /** @var User $instructor */
        $instructor = User::factory()->create(['role' => 'instructor']);

        Course::factory()->create([
            'creator_id' => $instructor->id,
            'title' => 'My Course 1',
        ]);
        Course::factory()->create([
            'creator_id' => $instructor->id,
            'title' => 'My Course 2',
        ]);

        $tool = new InstructorStudentTool;
        $tool->setUserId($instructor->id);

        $result = $tool->execute(['only_courses' => true]);

        $this->assertSame(2, $result['total_owned_courses']);
        $this->assertCount(2, $result['owned_courses']);
        $this->assertEquals(['My Course 1', 'My Course 2'], array_column($result['owned_courses'], 'title'));
    }

    public function test_instructor_cannot_access_students_enrolled_only_in_other_instructor_courses(): void
    {
        /** @var User $instructor1 */
        $instructor1 = User::factory()->create(['role' => 'instructor']);
        /** @var User $instructor2 */
        $instructor2 = User::factory()->create(['role' => 'instructor']);

        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);

        /** @var Course $otherCourse */
        $otherCourse = Course::factory()->create(['creator_id' => $instructor2->id]);

        Enrollment::create([
            'user_id' => $student->id,
            'course_id' => $otherCourse->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        $tool = new InstructorStudentTool;
        $tool->setUserId($instructor1->id);

        // Attempt to access student not enrolled in instructor1's courses
        $result = $tool->execute(['student_id' => $student->id]);

        $this->assertArrayHasKey('error', $result);
        $this->assertStringContainsString('Akses ditolak', $result['error']);

        // Attempt to access course owned by instructor2
        $resultCourse = $tool->execute(['course_id' => $otherCourse->id]);
        $this->assertArrayHasKey('error', $resultCourse);
        $this->assertStringContainsString('Akses ditolak', $resultCourse['error']);
    }

    public function test_user_can_only_view_own_progress(): void
    {
        /** @var User $student1 */
        $student1 = User::factory()->create(['role' => 'student']);
        /** @var User $student2 */
        $student2 = User::factory()->create(['role' => 'student']);

        /** @var Course $course */
        $course = Course::factory()->create();

        Enrollment::create([
            'user_id' => $student1->id,
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        $tool = new UserProgressTool;
        $tool->setUserId($student2->id);

        $result = $tool->execute([]);

        // student2 has no enrollments
        $this->assertEmpty($result['active_courses']);
        $this->assertEmpty($result['completed_courses']);
    }

    public function test_user_cannot_access_another_users_chat_session(): void
    {
        /** @var User $user1 */
        $user1 = User::factory()->create(['role' => 'student']);
        /** @var User $user2 */
        $user2 = User::factory()->create(['role' => 'student']);

        $session = \App\Models\ChatSession::create([
            'user_id' => $user1->id,
            'title' => 'User 1 Secret Chat',
        ]);

        $this->actingAs($user2);

        $this->get(route('ai.chat.show', $session->id))->assertForbidden();
        $this->get(route('ai.chat.messages', $session->id))->assertForbidden();
        $this->post(route('ai.chat.storeMessage', $session->id), ['message' => 'Hello'])->assertForbidden();
        $this->delete(route('ai.chat.destroy', $session->id))->assertForbidden();
    }

    public function test_instructor_can_access_full_earnings_and_ratings_for_own_courses(): void
    {
        /** @var User $instructor1 */
        $instructor1 = User::factory()->create(['role' => 'instructor', 'name' => 'Instructor One']);
        /** @var User $instructor2 */
        $instructor2 = User::factory()->create(['role' => 'instructor', 'name' => 'Instructor Two']);

        /** @var User $student */
        $student = User::factory()->create(['role' => 'student', 'name' => 'Student Alice']);

        // Instructor 1's paid course
        /** @var Course $course1 */
        $course1 = Course::factory()->create([
            'creator_id' => $instructor1->id,
            'title' => 'Mastering AI with Laravel',
            'type' => 'paid',
            'price' => 200000,
            'rating_avg' => 4.9,
            'rating_count' => 1,
        ]);

        Enrollment::create([
            'user_id' => $student->id,
            'course_id' => $course1->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        Review::create([
            'user_id' => $student->id,
            'course_id' => $course1->id,
            'rating' => 5,
            'comment' => 'Kursus paling komprehensif!',
            'is_approved' => true,
        ]);

        // Instructor 2's course
        /** @var Course $course2 */
        $course2 = Course::factory()->create([
            'creator_id' => $instructor2->id,
            'title' => 'Instructor Two Secret Course',
            'type' => 'paid',
            'price' => 999000,
            'rating_avg' => 3.5,
            'rating_count' => 1,
        ]);

        Enrollment::create([
            'user_id' => $student->id,
            'course_id' => $course2->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        $analyticsTool = new InstructorAnalyticsTool;
        $analyticsTool->setUserId($instructor1->id);

        // Instructor 1 fetches full analytics
        $result = $analyticsTool->execute([]);

        $this->assertSame('Instructor One', $result['instructor']['name']);
        $this->assertSame(1, $result['summary']['total_courses']);
        $this->assertSame(200000.0, $result['summary']['total_earnings']);
        $this->assertSame('Rp 200.000', $result['summary']['formatted_total_earnings']);
        $this->assertSame(4.9, $result['summary']['average_rating']);
        $this->assertSame(1, $result['summary']['total_reviews']);

        // Course breakdown only has course 1, never course 2
        $this->assertCount(1, $result['courses']);
        $this->assertSame('Mastering AI with Laravel', $result['courses'][0]['title']);
        $this->assertSame(200000.0, $result['courses'][0]['earnings']);

        // Recent reviews contains only Instructor 1's course reviews
        $this->assertCount(1, $result['recent_reviews']);
        $this->assertSame('Kursus paling komprehensif!', $result['recent_reviews'][0]['comment']);
    }

    public function test_instructor_strictly_forbidden_from_accessing_other_instructor_earnings_or_ratings(): void
    {
        /** @var User $instructor1 */
        $instructor1 = User::factory()->create(['role' => 'instructor']);
        /** @var User $instructor2 */
        $instructor2 = User::factory()->create(['role' => 'instructor']);

        /** @var Course $course2 */
        $course2 = Course::factory()->create([
            'creator_id' => $instructor2->id,
            'title' => 'Advanced Trading Secrets',
            'type' => 'paid',
            'price' => 5000000,
        ]);

        $analyticsTool = new InstructorAnalyticsTool;
        $analyticsTool->setUserId($instructor1->id);

        // Attempt by instructor 1 to query course 2
        $resultCourseId = $analyticsTool->execute(['course_id' => $course2->id]);
        $this->assertArrayHasKey('error', $resultCourseId);
        $this->assertStringContainsString('Akses ditolak', $resultCourseId['error']);

        $resultCourseTitle = $analyticsTool->execute(['course_title' => 'Advanced Trading Secrets']);
        $this->assertArrayHasKey('error', $resultCourseTitle);
        $this->assertStringContainsString('Akses ditolak', $resultCourseTitle['error']);

        // Attempt by instructor 1 to query instructor 2's ID
        $resultInstructorId = $analyticsTool->execute(['instructor_id' => $instructor2->id]);
        $this->assertArrayHasKey('error', $resultInstructorId);
        $this->assertStringContainsString('Akses ditolak', $resultInstructorId['error']);
    }

    public function test_student_cannot_access_instructor_analytics(): void
    {
        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);

        $analyticsTool = new InstructorAnalyticsTool;
        $analyticsTool->setUserId($student->id);

        $result = $analyticsTool->execute([]);
        $this->assertArrayHasKey('error', $result);
        $this->assertStringContainsString('Akses ditolak', $result['error']);
    }

    public function test_course_detail_tool_includes_owner_analytics_only_for_owner(): void
    {
        /** @var User $instructor1 */
        $instructor1 = User::factory()->create(['role' => 'instructor']);
        /** @var User $instructor2 */
        $instructor2 = User::factory()->create(['role' => 'instructor']);
        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);

        /** @var Course $course */
        $course = Course::factory()->create([
            'creator_id' => $instructor1->id,
            'title' => 'Cloud Architecture Masterclass',
            'type' => 'paid',
            'price' => 300000,
            'rating_avg' => 5.0,
            'rating_count' => 1,
            'status' => 'published',
        ]);

        Enrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        Review::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'rating' => 5,
            'comment' => 'Arsitekturnya keren banget!',
            'is_approved' => true,
        ]);

        $detailTool = new CourseDetailTool;

        // 1. Owner views course: has owner_analytics with earnings & review
        $detailTool->setUserId($instructor1->id);
        $ownerResult = $detailTool->execute(['course_id' => $course->id]);
        $this->assertTrue($ownerResult['is_owner']);
        $this->assertArrayHasKey('owner_analytics', $ownerResult);
        $this->assertSame(300000.0, $ownerResult['owner_analytics']['earnings']);
        $this->assertSame('Rp 300.000', $ownerResult['owner_analytics']['formatted_earnings']);
        $this->assertSame(1, $ownerResult['owner_analytics']['enrolled_students_count']);
        $this->assertSame(5.0, $ownerResult['owner_analytics']['rating_avg']);
        $this->assertCount(1, $ownerResult['owner_analytics']['recent_reviews']);

        // 2. Another instructor views course: NO owner_analytics
        $detailTool->setUserId($instructor2->id);
        $otherInstructorResult = $detailTool->execute(['course_id' => $course->id]);
        $this->assertFalse($otherInstructorResult['is_owner']);
        $this->assertArrayNotHasKey('owner_analytics', $otherInstructorResult);

        // 3. Student views course: NO owner_analytics
        $detailTool->setUserId($student->id);
        $studentResult = $detailTool->execute(['course_id' => $course->id]);
        $this->assertFalse($studentResult['is_owner']);
        $this->assertArrayNotHasKey('owner_analytics', $studentResult);
    }
}
