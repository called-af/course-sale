<?php

namespace Tests\Feature;

use App\Models\AppearanceSetting;
use App\Models\Category;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LandingSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LandingContentTest extends TestCase
{
    use RefreshDatabase;

    public function test_landing_page_uses_real_instructors_and_certificates_and_skips_hidden_sections(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $instructor = User::factory()->create([
            'role' => 'instructor',
            'name' => 'Real Instructor',
            'headline' => 'Senior Product Designer',
            'bio' => 'Leads product design workshops.',
        ]);
        $student = User::factory()->create(['role' => 'student', 'name' => 'Real Student']);

        $course = Course::factory()->create([
            'creator_id' => $instructor->id,
            'status' => 'published',
            'published_at' => now(),
        ]);
        $course->categories()->attach(Category::factory()->create(['name' => 'Design']));

        Enrollment::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => 'active',
            'enrolled_at' => now(),
        ]);

        $certificate = Certificate::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'certificate_number' => 'CERT-LANDING-001',
            'issued_at' => now()->parse('2026-11-12 09:00:00'),
        ]);

        LandingSetting::put(LandingSetting::SECTION_COURSES, ['show' => false]);
        LandingSetting::put(LandingSetting::SECTION_CAREER, ['show' => false]);
        LandingSetting::put(LandingSetting::SECTION_TESTIMONIAL, ['show' => false]);
        LandingSetting::put(LandingSetting::SECTION_INSTRUCTOR, [
            'show' => true,
            'mode' => 'selected',
            'selected_ids' => [$instructor->id],
            'sort' => 'selected',
            'limit' => 4,
        ]);
        LandingSetting::put(LandingSetting::SECTION_CERTIFICATE, [
            'show' => true,
            'mode' => 'featured',
            'featured_ids' => [$certificate->id],
            'limit' => 3,
        ]);

        $this->actingAs($admin)
            ->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('landing/page')
                ->where('courses', [])
                ->where('categories', [])
                ->where('testimonials', [])
                ->where('instructors.0.name', 'Real Instructor')
                ->where('instructors.0.role', 'Senior Product Designer')
                ->where('instructors.0.courses', 1)
                ->where('instructors.0.students', 1)
                ->where('instructors.0.expertise.0', 'Design')
                ->where('certificates.0.id', $certificate->id)
                ->where('certificates.0.student_name', 'Real Student')
                ->where('certificates.0.instructor_name', 'Real Instructor')
                ->where('certificates.0.verify_url', url('/certificate/CERT-LANDING-001'))
                ->where('certificateTemplate.mode', 'default')
                ->where('certificates.0.template.mode', 'default')
                ->where('certificates.0.template.elements.student_name.visible', true)
                ->where('certificates.0.template.elements.course_title.visible', true));
    }

    public function test_landing_provides_the_global_template_for_the_labelled_sample(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        LandingSetting::put(LandingSetting::SECTION_CERTIFICATE, [
            'show' => true,
            'mode' => 'latest',
            'featured_ids' => [],
            'show_sample_when_empty' => true,
        ]);

        AppearanceSetting::current()->update([
            'certificate_template' => [
                'mode' => 'default',
                'primary_color' => '#1d4ed8',
                'accent_color' => '#93c5fd',
                'bg_style' => 'light',
                'show_signature' => true,
                'signature_name' => 'Global Signer',
                'elements' => [
                    'student_name' => [
                        'x' => 50,
                        'y' => 38,
                        'fontSize' => 40,
                        'color' => '#111827',
                        'align' => 'center',
                        'visible' => true,
                    ],
                ],
            ],
        ]);

        $this->actingAs($admin)
            ->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('landing/page')
                ->where('certificates', [])
                ->where('certificateTemplate.primary_color', '#1d4ed8')
                ->where('certificateTemplate.bg_style', 'light')
                ->where('certificateTemplate.signature_name', 'Global Signer')
                ->where('certificateTemplate.elements.student_name.fontSize', 40)
                ->where('certificateTemplate.elements.signature_name.visible', true));
    }

    public function test_landing_certificate_uses_the_course_signature_override_in_its_template(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $instructor = User::factory()->create(['role' => 'instructor', 'name' => 'Course Instructor']);
        $student = User::factory()->create(['role' => 'student', 'name' => 'Course Student']);
        $course = Course::factory()->create([
            'creator_id' => $instructor->id,
            'status' => 'published',
            'certificate_template' => ['signature_name' => 'Course Signer'],
        ]);

        Certificate::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'certificate_number' => 'CERT-SIGNATURE-001',
            'issued_at' => now(),
        ]);

        LandingSetting::put(LandingSetting::SECTION_CERTIFICATE, [
            'show' => true,
            'mode' => 'latest',
            'featured_ids' => [],
        ]);

        $this->actingAs($admin)
            ->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('certificates.0.template.signature_name', 'Course Signer')
                ->where('certificates.0.template.elements.signature_name.text', 'Course Signer'));
    }

    public function test_admin_landing_settings_page_provides_real_selection_options(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $instructor = User::factory()->create([
            'role' => 'instructor',
            'name' => 'Option Instructor',
            'headline' => 'UX Architect',
        ]);
        $student = User::factory()->create(['role' => 'student', 'name' => 'Option Student']);
        $course = Course::factory()->create(['creator_id' => $instructor->id]);

        $certificate = Certificate::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'certificate_number' => 'CERT-OPTION-001',
            'issued_at' => now(),
        ]);

        $this->actingAs($admin)
            ->get(route('admin.settings.landing.edit', 'instructor'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/landing/Settings')
                ->where('section', 'instructor')
                ->where('instructorOptions.0.id', $instructor->id)
                ->where('instructorOptions.0.name', 'Option Instructor')
                ->where('instructorOptions.0.headline', 'UX Architect')
                ->where('certificateOptions', []));

        $this->actingAs($admin)
            ->get(route('admin.settings.landing.edit', 'certificate'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/landing/Settings')
                ->where('section', 'certificate')
                ->where('certificateOptions.0.id', $certificate->id)
                ->where('certificateOptions.0.certificate_number', 'CERT-OPTION-001')
                ->where('instructorOptions', []));
    }

    public function test_admin_landing_update_strips_unknown_keys_and_sanitizes_links(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $instructor = User::factory()->create(['role' => 'instructor']);
        $instructorId = $instructor->id;

        $this->actingAs($admin)
            ->put(route('admin.settings.landing.update', 'instructor'), [
                'content' => [
                    'show' => 'false',
                    'badge' => 'Instructors',
                    'title_lead' => 'Learn From ',
                    'title_highlight' => 'Practitioners',
                    'description' => 'Real instructors only.',
                    'cta_label' => 'Browse',
                    'cta_href' => 'javascript:alert(1)',
                    'mode' => 'selected',
                    'selected_ids' => [$instructorId, $instructorId, -4],
                    'sort' => 'selected',
                    'limit' => 4,
                    'default_role' => 'Instructor',
                    'injected' => 'should-not-be-stored',
                ],
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $content = LandingSetting::content(LandingSetting::SECTION_INSTRUCTOR);

        $this->assertFalse($content['show']);
        $this->assertSame('#', $content['cta_href']);
        $this->assertSame([$instructorId], $content['selected_ids']);
        $this->assertArrayNotHasKey('injected', $content);
    }

    public function test_admin_landing_update_rejects_instructor_and_certificate_ids_that_do_not_exist(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->put(route('admin.settings.landing.update', 'instructor'), [
                'content' => [
                    'mode' => 'selected',
                    'selected_ids' => [999999],
                ],
            ])
            ->assertSessionHasErrors('selected_ids.0');

        $this->actingAs($admin)
            ->put(route('admin.settings.landing.update', 'certificate'), [
                'content' => [
                    'mode' => 'featured',
                    'featured_ids' => [999999],
                ],
            ])
            ->assertSessionHasErrors('featured_ids.0');
    }

    public function test_certificate_verification_page_resolves_the_real_certificate(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $instructor = User::factory()->create(['role' => 'instructor']);
        $course = Course::factory()->create(['creator_id' => $instructor->id]);

        Certificate::create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'certificate_number' => 'CERT-VERIFY-001',
            'issued_at' => now()->parse('2026-11-12 09:00:00'),
        ]);

        $this->get(route('certificate.verify', 'CERT-VERIFY-001'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('certificate/[number]/page')
                ->where('valid', true)
                ->where('certificate.certificate_number', 'CERT-VERIFY-001'));
    }

    public function test_admin_can_upload_a_custom_payment_logo_used_by_the_landing_page(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post(route('admin.settings.landing.update', 'trust'), [
                '_method' => 'put',
                'content' => [
                    'show' => true,
                    'payment_methods' => ['BCA', 'QRIS'],
                    'payment_logos' => [],
                    'guarantees' => ['Encrypted payment gateway'],
                ],
                'payment_logo_files' => [
                    'bca' => new UploadedFile(public_path('images/payment-methods/bca.png'), 'bca.png', 'image/png', null, true),
                ],
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $logos = LandingSetting::content(LandingSetting::SECTION_TRUST)['payment_logos'];

        $this->assertArrayHasKey('bca', $logos);
        $this->assertStringStartsWith('/storage/payment-logos/', $logos['bca']);
        Storage::disk('public')->assertExists(Str::after($logos['bca'], '/storage/'));

        $this->actingAs($admin)
            ->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('landing.trust.payment_methods', ['BCA', 'QRIS'])
                ->where('landing.trust.payment_logos.bca', $logos['bca']));
    }

    public function test_admin_trust_logo_urls_are_sanitized(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->put(route('admin.settings.landing.update', 'trust'), [
                'content' => [
                    'show' => true,
                    'payment_methods' => ['BCA', 'OVO'],
                    'payment_logos' => [
                        'bca' => '/storage/payment-logos/custom.png',
                        'ovo' => '/storage/payment-logos/../../secret.txt',
                    ],
                    'guarantees' => [],
                ],
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $logos = LandingSetting::content(LandingSetting::SECTION_TRUST)['payment_logos'];

        $this->assertSame(['bca' => '/storage/payment-logos/custom.png'], $logos);
    }
}
