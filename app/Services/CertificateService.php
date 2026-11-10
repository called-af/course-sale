<?php

namespace App\Services;

use App\Models\AppearanceSetting;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\Material;
use App\Models\MaterialProgress;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CertificateService
{
    /**
     * Check if user has already completed the course (100% progress).
     */
    public function isCourseCompleted(User $user, Course $course): bool
    {
        $materialIds = Material::where('status', 'published')
            ->whereHas('module', fn ($query) => $query
                ->where('course_id', $course->id)
                ->where('status', 'published'))
            ->whereHas('contents', fn ($query) => $query->where('status', 'published'))
            ->pluck('id')
            ->filter()
            ->values();

        if ($materialIds->isEmpty()) {
            return false;
        }

        $completedCount = MaterialProgress::where('user_id', $user->id)
            ->whereIn('material_id', $materialIds)
            ->where('is_completed', true)
            ->count();

        return $completedCount >= $materialIds->count();
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

        return $certificate->update(['pdf_path' => $pdfPath]) ?? $certificate;
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

        $template = $course->certificate_template ?? [];
        $verifyUrl = url('/certificate/'.$certificate->certificate_number);
        $appearance = AppearanceSetting::current();
        $brandName = $appearance->displayName();

        $pdf = Pdf::loadView('pdf.certificate', [
            'studentName' => $certificate->user?->name ?? 'Student',
            'courseTitle' => $course->title,
            'instructorName' => $course->creator?->name ?? $brandName,
            'issuedAt' => ($certificate->issued_at ?? now())->format('d F Y'),
            'certificateNumber' => $certificate->certificate_number,
            'verifyUrl' => $verifyUrl,
            'brandName' => $brandName,
            'brandDomain' => $appearance->domain(),

            // Template customisations (dengan fallback ke default)
            'primaryColor' => $template['primary_color'] ?? '#7c3aed',
            'accentColor' => $template['accent_color'] ?? '#a78bfa',
            'bgStyle' => $template['bg_style'] ?? 'dark',
            'showSignature' => (bool) ($template['show_signature'] ?? false),
            'signatureName' => $template['signature_name'] ?? ($course->creator?->name ?? $brandName),
            'customTitle' => filled($template['custom_title'] ?? '') ? $template['custom_title'] : 'Certificate of Completion',
            'footerNote' => $template['footer_note'] ?? '',
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
