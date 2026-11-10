<?php

namespace App\Http\Controllers;

use App\Models\AppearanceSetting;
use App\Models\Certificate;
use App\Services\CertificateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CertificateController extends Controller
{
    public function __construct(protected CertificateService $certificateService) {}

    /**
     * Show all certificates for the authenticated student.
     */
    public function index(Request $request): \Inertia\Response
    {
        $brandName = AppearanceSetting::current()->displayName();
        $certificates = Certificate::where('user_id', $request->user()->id)
            ->with(['course' => fn ($query) => $query->withTrashed(), 'course.creator:id,name'])
            ->latest('issued_at')
            ->get()
            ->filter(fn ($cert) => $cert->course !== null)
            ->map(fn ($cert) => [
                'id' => $cert->id,
                'certificate_number' => $cert->certificate_number,
                'issued_at' => $cert->issued_at->format('d M Y'),
                'has_pdf' => (bool) $cert->pdf_path,
                'course' => [
                    'id' => $cert->course->id,
                    'title' => $cert->course->title,
                    'slug' => $cert->course->slug,
                    'thumbnail_url' => $cert->course->thumbnail_url,
                    'instructor' => $cert->course->creator?->name ?? $brandName,
                ],
            ])
            ->values();

        return Inertia::render('student/certificates/page', [
            'certificates' => $certificates,
        ]);
    }

    /**
     * Download / stream the certificate PDF for the authenticated student.
     */
    public function download(Request $request, Certificate $certificate): Response|RedirectResponse
    {
        // Ensure the certificate belongs to this user
        abort_unless($certificate->user_id === $request->user()->id, 403);

        // Regenerate (and persist) the PDF if it has never been stored or went missing.
        if (! $certificate->pdf_path || ! Storage::disk('public')->exists($certificate->pdf_path)) {
            $path = $this->certificateService->generatePdf($certificate);
            $certificate->update(['pdf_path' => $path]);
            $certificate->refresh();
        }

        abort_unless(
            $certificate->pdf_path && Storage::disk('public')->exists($certificate->pdf_path),
            404,
            'Certificate file is not available.'
        );

        $filename = 'Certificate-'.$certificate->certificate_number.'.pdf';

        return response(
            Storage::disk('public')->get($certificate->pdf_path),
            200,
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            ]
        );
    }

    /**
     * Public verification page — accessible by anyone via certificate number.
     */
    public function verify(string $certificateNumber): \Inertia\Response
    {
        $certificate = Certificate::where('certificate_number', $certificateNumber)
            ->with([
                'user' => fn ($query) => $query->withTrashed(),
                'course' => fn ($query) => $query->withTrashed(),
                'course.creator:id,name',
            ])
            ->first();

        if (! $certificate || ! $certificate->course) {
            return Inertia::render('certificate/[number]/page', [
                'certificate' => null,
                'valid' => false,
            ]);
        }

        return Inertia::render('certificate/[number]/page', [
            'certificate' => [
                'id' => $certificate->id,
                'certificate_number' => $certificate->certificate_number,
                'issued_at' => $certificate->issued_at->format('d F Y'),
                'student_name' => $certificate->user?->name ?? 'Student',
                'course' => [
                    'title' => $certificate->course->title,
                    'slug' => $certificate->course->slug,
                    'thumbnail_url' => $certificate->course->thumbnail_url,
                    'instructor' => $certificate->course->creator?->name ?? AppearanceSetting::current()->displayName(),
                ],
            ],
            'valid' => true,
        ]);
    }
}
