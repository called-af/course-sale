<?php

namespace App\Services;

use App\Models\AppearanceSetting;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CertificateService
{
    /**
     * Default element layout (percent-based) for custom/uploaded templates.
     *
     * @return array<string, array<string, mixed>>
     */
    public function defaultElements(): array
    {
        return [
            'title' => [
                'x' => 50, 'y' => 18, 'fontSize' => 14, 'color' => '#6b7280', 'align' => 'center', 'visible' => true,
                'text' => 'Certificate of Completion',
                'label' => 'Title',
            ],
            'subtitle' => [
                'x' => 50, 'y' => 28, 'fontSize' => 10, 'color' => '#6b7280', 'align' => 'center', 'visible' => true,
                'text' => 'This certifies that',
                'label' => 'Subtitle',
            ],
            'student_name' => [
                'x' => 50, 'y' => 38, 'fontSize' => 38, 'color' => '#111827', 'align' => 'center', 'visible' => true,
                'label' => 'Student Name',
            ],
            'completion_text' => [
                'x' => 50, 'y' => 48, 'fontSize' => 10, 'color' => '#6b7280', 'align' => 'center', 'visible' => true,
                'text' => 'has successfully completed',
                'label' => 'Completion Text',
            ],
            'course_title' => [
                'x' => 50, 'y' => 56, 'fontSize' => 22, 'color' => '#7c3aed', 'align' => 'center', 'visible' => true,
                'label' => 'Course Title',
            ],
            'issued_at' => [
                'x' => 25, 'y' => 72, 'fontSize' => 11, 'color' => '#374151', 'align' => 'center', 'visible' => true,
                'label' => 'Issued Date',
                'prefix' => 'Issued On',
            ],
            'certificate_number' => [
                'x' => 50, 'y' => 72, 'fontSize' => 10, 'color' => '#7c3aed', 'align' => 'center', 'visible' => true,
                'label' => 'Certificate Number',
                'prefix' => 'Certificate No.',
            ],
            'instructor_name' => [
                'x' => 75, 'y' => 72, 'fontSize' => 11, 'color' => '#374151', 'align' => 'center', 'visible' => true,
                'label' => 'Instructor',
                'prefix' => 'Instructor',
            ],
            'footer_note' => [
                'x' => 50, 'y' => 86, 'fontSize' => 9, 'color' => '#6b7280', 'align' => 'center', 'visible' => true,
                'label' => 'Footer Note',
            ],
            'signature_name' => [
                'x' => 50, 'y' => 80, 'fontSize' => 11, 'color' => '#374151', 'align' => 'center', 'visible' => false,
                'label' => 'Signature Name',
                'prefix' => 'Instructor',
            ],
        ];
    }

    /**
     * Normalize/merge element config with defaults.
     *
     * @param  array<string, mixed>  $elements
     * @return array<string, array<string, mixed>>
     */
    public function normalizeElements(array $elements): array
    {
        $defaults = $this->defaultElements();
        $normalized = [];

        foreach ($defaults as $key => $default) {
            $input = is_array($elements[$key] ?? null) ? $elements[$key] : [];

            $normalized[$key] = array_merge($default, [
                'x' => $this->clampFloat($input['x'] ?? $default['x'], 0, 100),
                'y' => $this->clampFloat($input['y'] ?? $default['y'], 0, 100),
                'fontSize' => $this->clampFloat($input['fontSize'] ?? $default['fontSize'], 6, 120),
                'color' => $this->normalizeHex($input['color'] ?? $default['color'], $default['color']),
                'align' => in_array($input['align'] ?? $default['align'], ['left', 'center', 'right'], true)
                    ? ($input['align'] ?? $default['align'])
                    : $default['align'],
                'visible' => array_key_exists('visible', $input)
                    ? filter_var($input['visible'], FILTER_VALIDATE_BOOLEAN)
                    : (bool) $default['visible'],
            ]);

            if (array_key_exists('text', $default) || array_key_exists('text', $input)) {
                $text = $input['text'] ?? ($default['text'] ?? '');
                $normalized[$key]['text'] = is_string($text) ? mb_substr($text, 0, 200) : (string) ($default['text'] ?? '');
            }

            if (array_key_exists('prefix', $default)) {
                $normalized[$key]['prefix'] = $default['prefix'];
            }
            $normalized[$key]['label'] = $default['label'] ?? $key;
        }

        // Preserve admin-added custom text layers (keys prefixed with custom_).
        $customCount = 0;
        foreach ($elements as $key => $input) {
            if ($customCount >= 24) {
                break;
            }
            if (! is_string($key) || ! preg_match('/^custom_[a-z0-9_]+$/i', $key)) {
                continue;
            }
            if (! is_array($input)) {
                continue;
            }

            $text = $input['text'] ?? '';
            if (! is_string($text) || trim($text) === '') {
                continue;
            }

            $normalized[$key] = [
                'x' => $this->clampFloat($input['x'] ?? 50, 0, 100),
                'y' => $this->clampFloat($input['y'] ?? 50, 0, 100),
                'fontSize' => $this->clampFloat($input['fontSize'] ?? 14, 6, 120),
                'color' => $this->normalizeHex($input['color'] ?? '#111827', '#111827'),
                'align' => in_array($input['align'] ?? 'center', ['left', 'center', 'right'], true)
                    ? $input['align']
                    : 'center',
                'visible' => filter_var($input['visible'] ?? true, FILTER_VALIDATE_BOOLEAN),
                'text' => mb_substr($text, 0, 200),
                'label' => is_string($input['label'] ?? null) ? mb_substr($input['label'], 0, 40) : 'Text',
            ];
            $customCount++;
        }

        return $normalized;
    }

    private function clampFloat(mixed $value, float $min, float $max): float
    {
        if (! is_numeric($value)) {
            return $min;
        }

        return max($min, min($max, (float) $value));
    }

    private function normalizeHex(mixed $value, string $fallback): string
    {
        if (is_string($value) && preg_match('/^#[0-9a-fA-F]{6}$/', $value)) {
            return strtolower($value);
        }

        return $fallback;
    }

    /**
     * Build normalized payload from a raw template array (global or legacy).
     *
     * @param  array<string, mixed>  $template
     * @return array<string, mixed>
     */
    public function buildTemplatePayload(array $template): array
    {
        $elements = $this->normalizeElements(is_array($template['elements'] ?? null) ? $template['elements'] : []);

        // Backward compatibility with legacy fields.
        if (! empty($template['custom_title'])) {
            $elements['title']['text'] = $template['custom_title'];
        }
        if (array_key_exists('footer_note', $template)) {
            $elements['footer_note']['text'] = (string) ($template['footer_note'] ?? '');
            $elements['footer_note']['visible'] = filled($template['footer_note'] ?? '') || ($elements['footer_note']['visible'] ?? true);
        }
        if (array_key_exists('show_signature', $template)) {
            $elements['signature_name']['visible'] = (bool) $template['show_signature'];
        }

        $backgroundPath = $template['background_path'] ?? null;
        $mode = $backgroundPath ? 'custom' : ($template['mode'] ?? 'default');

        $signaturePath = is_string($template['signature_image'] ?? null) && $template['signature_image'] !== ''
            ? $template['signature_image']
            : null;

        return [
            'mode' => $mode,
            'background_path' => $backgroundPath,
            'background_url' => $backgroundPath ? Storage::disk('public')->url($backgroundPath) : null,

            'primary_color' => $template['primary_color'] ?? '#7c3aed',
            'accent_color' => $template['accent_color'] ?? '#a78bfa',
            'bg_style' => $template['bg_style'] ?? 'dark',
            'show_signature' => (bool) ($template['show_signature'] ?? ($elements['signature_name']['visible'] ?? false)),
            'signature_name' => $template['signature_name'] ?? '',
            'signature_image' => $signaturePath,
            'signature_image_url' => $signaturePath ? Storage::disk('public')->url($signaturePath) : null,
            'custom_title' => $template['custom_title'] ?? ($elements['title']['text'] ?? ''),
            'footer_note' => $template['footer_note'] ?? ($elements['footer_note']['text'] ?? ''),

            'elements' => $elements,
        ];
    }

    /**
     * Global certificate template payload (applies to all courses).
     *
     * @return array<string, mixed>
     */
    public function globalTemplatePayload(): array
    {
        $template = AppearanceSetting::current()->certificate_template ?? [];

        return $this->buildTemplatePayload(is_array($template) ? $template : []);
    }

    /**
     * Build template payload for a course: global design + per-course signature override.
     *
     * @return array<string, mixed>
     */
    public function templatePayload(Course $course): array
    {
        $payload = $this->globalTemplatePayload();
        $override = is_array($course->certificate_template) ? $course->certificate_template : [];

        $signatureName = $override['signature_name'] ?? null;
        if (is_string($signatureName) && $signatureName !== '') {
            $payload['signature_name'] = $signatureName;
            if (isset($payload['elements']['signature_name']) && is_array($payload['elements']['signature_name'])) {
                $payload['elements']['signature_name']['text'] = $signatureName;
            }
        }

        $signatureImage = $override['signature_image'] ?? null;
        if (is_string($signatureImage) && $signatureImage !== '') {
            $payload['signature_image'] = $signatureImage;
            $payload['signature_image_url'] = Storage::disk('public')->url($signatureImage);
        }

        return $payload;
    }

    /**
     * Check if user has already completed the course (100% progress).
     */
    public function isCourseCompleted(User $user, Course $course): bool
    {
        return app(EnrollmentService::class)->isCompleted($user, $course);
    }

    /**
     * Generate (or retrieve existing) certificate for a user + course.
     * Called from EnrollmentService@markProgress when 100% complete.
     */
    public function generateIfCompleted(User $user, Course $course): ?Certificate
    {
        // Already has a certificate for this course
        $existing = Certificate::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        if ($existing) {
            return $existing;
        }

        if (! $this->isCourseCompleted($user, $course)) {
            return null;
        }

        return $this->generate($user, $course);
    }

    /**
     * Force-generate a certificate (used internally when completion is confirmed).
     */
    public function generate(User $user, Course $course): Certificate
    {
        $certificateNumber = $this->generateCertificateNumber();
        $issuedAt = now();

        // Create DB record first
        $certificate = Certificate::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'certificate_number' => $certificateNumber,
            'issued_at' => $issuedAt,
        ]);

        // Generate PDF
        $pdfPath = $this->generatePdf($certificate);

        $certificate->update(['pdf_path' => $pdfPath]);

        return $certificate;
    }

    /**
     * Re-generate the PDF of an already issued certificate (e.g. after the
     * course template was edited).
     */
    public function regenerate(Certificate $certificate): Certificate
    {
        $certificate->loadMissing(['user', 'course.creator']);

        if (! $certificate->course) {
            throw new \RuntimeException('The course for this certificate no longer exists.');
        }

        $pdfPath = $this->generatePdf($certificate);

        $certificate->update(['pdf_path' => $pdfPath]);

        return $certificate->refresh();
    }

    /**
     * Render and store the certificate PDF. Returns storage path.
     */
    public function generatePdf(Certificate $certificate): string
    {
        $certificate->loadMissing(['user', 'course.creator']);

        $course = $certificate->course;

        if (! $course) {
            throw new \RuntimeException('The course for this certificate no longer exists.');
        }

        $templatePayload = $this->templatePayload($course);
        $verifyUrl = url('/certificate/'.$certificate->certificate_number);
        $appearance = AppearanceSetting::current();
        $brandName = $appearance->displayName();
        $issuedAt = ($certificate->issued_at ?? now())->format('d F Y');

        $backgroundPath = $templatePayload['background_path'] ?? null;
        $backgroundDataUri = null;
        if ($backgroundPath && Storage::disk('public')->exists($backgroundPath)) {
            $mime = Storage::disk('public')->mimeType($backgroundPath) ?: 'image/jpeg';
            $contents = Storage::disk('public')->get($backgroundPath);
            $backgroundDataUri = 'data:'.$mime.';base64,'.base64_encode($contents);
        }

        $signatureImageDataUri = null;
        $signatureImageSize = null;
        $signaturePath = $templatePayload['signature_image'] ?? null;
        if (is_string($signaturePath) && $signaturePath !== '' && Storage::disk('public')->exists($signaturePath)) {
            $signatureContents = Storage::disk('public')->get($signaturePath);
            $signatureMime = Storage::disk('public')->mimeType($signaturePath) ?: 'image/png';
            $signatureImageDataUri = 'data:'.$signatureMime.';base64,'.base64_encode($signatureContents);
            $size = @getimagesizefromstring($signatureContents);
            if (is_array($size)) {
                $signatureImageSize = ['width' => (int) $size[0], 'height' => (int) $size[1]];
            }
        }

        $elements = $templatePayload['elements'];
        $values = [
            'title' => filled($elements['title']['text'] ?? '') ? $elements['title']['text'] : 'Certificate of Completion',
            'subtitle' => $elements['subtitle']['text'] ?? 'This certifies that',
            'student_name' => $certificate->user?->name ?? 'Student',
            'completion_text' => $elements['completion_text']['text'] ?? 'has successfully completed',
            'course_title' => $course->title,
            'issued_at' => $issuedAt,
            'certificate_number' => $certificate->certificate_number,
            'instructor_name' => $elements['signature_name']['text'] ?? ($course->creator?->name ?? $brandName),
            'footer_note' => $templatePayload['footer_note'] ?? ($elements['footer_note']['text'] ?? ''),
            'signature_name' => filled($templatePayload['signature_name'] ?? '') ? $templatePayload['signature_name'] : ($course->creator?->name ?? $brandName),
            'brand_name' => $brandName,
        ];

        $pdf = Pdf::loadView('pdf.certificate', [
            'mode' => $backgroundDataUri ? 'custom' : 'default',
            'backgroundDataUri' => $backgroundDataUri,
            'signatureImageDataUri' => $signatureImageDataUri,
            'signatureImageSize' => $signatureImageSize,
            'elements' => $elements,
            'values' => $values,

            'studentName' => $values['student_name'],
            'courseTitle' => $values['course_title'],
            'instructorName' => $course->creator?->name ?? $brandName,
            'issuedAt' => $issuedAt,
            'certificateNumber' => $certificate->certificate_number,
            'verifyUrl' => $verifyUrl,
            'brandName' => $brandName,
            'brandDomain' => $appearance->domain(),

            'primaryColor' => $templatePayload['primary_color'] ?? '#7c3aed',
            'accentColor' => $templatePayload['accent_color'] ?? '#a78bfa',
            'bgStyle' => $templatePayload['bg_style'] ?? 'dark',
            'showSignature' => (bool) ($templatePayload['show_signature'] ?? ($elements['signature_name']['visible'] ?? false)),
            'signatureName' => $values['signature_name'],
            'customTitle' => $values['title'],
            'footerNote' => $values['footer_note'],
        ]);

        $pdf->setPaper('a4', 'landscape');

        $filename = 'certificates/'.$certificate->certificate_number.'.pdf';
        Storage::disk('public')->put($filename, $pdf->output());

        return $filename;
    }

    /**
     * Generate a unique certificate number.
     * Format: KRSIO-YYYYMM-XXXXXXXX (e.g. KRSIO-202609-A3F2B1C4)
     */
    private function generateCertificateNumber(): string
    {
        do {
            $number = 'KRSIO-'.now()->format('Ym').'-'.strtoupper(Str::random(8));
        } while (Certificate::where('certificate_number', $number)->exists());

        return $number;
    }
}
