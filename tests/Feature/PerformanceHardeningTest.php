<?php

namespace Tests\Feature;

use App\Jobs\RegenerateCertificatePdfJob;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\MaterialContentProgress;
use App\Models\MaterialProgress;
use App\Models\Module;
use App\Models\User;
use App\Models\UserEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class PerformanceHardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_global_certificate_template_update_queues_pdf_regeneration(): void
    {
        /** @var User $admin */
        $admin = User::factory()->create(['role' => 'admin']);
        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);
        /** @var Course $course */
        $course = Course::factory()->create(['creator_id' => $admin->id]);

        Certificate::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'certificate_number' => 'CERT-PERF-001',
            'issued_at' => now(),
            'pdf_path' => 'certificates/old.pdf',
        ]);

        Queue::fake();

        $this->actingAs($admin)
            ->put('/admin/certificate-template', [
                'primary_color' => '#000000',
                'accent_color' => '#ffffff',
                'bg_style' => 'dark',
                'show_signature' => true,
            ])
            ->assertRedirect();

        Queue::assertPushed(RegenerateCertificatePdfJob::class, 1);
    }

    public function test_opening_the_lesson_page_does_not_write_tracking_or_progress_rows(): void
    {
        /** @var User $instructor */
        $instructor = User::factory()->create(['role' => 'instructor']);
        /** @var User $student */
        $student = User::factory()->create(['role' => 'student']);
        /** @var Course $course */
        $course = Course::factory()->create([
            'creator_id' => $instructor->id,
            'status' => 'published',
            'type' => 'free',
        ]);

        Enrollment::factory()->create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        /** @var Module $module */
        $module = Module::factory()->create(['course_id' => $course->id, 'status' => 'published']);
        /** @var Material $material */
        $material = Material::factory()->create(['module_id' => $module->id, 'status' => 'published']);
        MaterialContent::factory()->create([
            'material_id' => $material->id,
            'type' => 'text',
            'status' => 'published',
        ]);

        $this->actingAs($student)
            ->get("/student/courses/{$course->slug}")
            ->assertOk();

        $this->assertSame(0, UserEvent::count());
        $this->assertSame(0, MaterialProgress::count());
        $this->assertSame(0, MaterialContentProgress::count());
    }
}
