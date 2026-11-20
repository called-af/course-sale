<?php

namespace App\Http\Controllers;

use App\Models\AppearanceSetting;
use App\Models\Certificate;
use App\Models\Course;
use App\Rules\TransparentPng;
use App\Services\CertificateService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CertificateTemplateController extends Controller
{
    public function __construct(
        protected CertificateService $certificateService,
    ) {}

    /**
     * Global certificate template editor (admin only).
     */
    public function globalShow(Request $request): \Inertia\Response
    {
        $this->authorizeAdmin($request);

        return Inertia::render('admin/certificate-template/page', [
            'template' => $this->certificateService->globalTemplatePayload(),
        ]);
    }

    /**
     * Save global certificate template (admin only).
     */
    public function globalUpdate(Request $request): RedirectResponse
    {
        $this->authorizeAdmin($request);

        $setting = AppearanceSetting::current();
        $current = is_array($setting->certificate_template) ? $setting->certificate_template : [];

        if ($request->filled('elements') && is_string($request->input('elements'))) {
            $decoded = json_decode($request->input('elements'), true);
            $request->merge(['elements' => is_array($decoded) ? $decoded : []]);
        }

        $validated = $request->validate([
            'mode' => ['nullable', Rule::in(['default', 'custom'])],
            'background_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'remove_background' => ['nullable', 'boolean'],

            'primary_color' => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'accent_color' => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'bg_style' => ['required', Rule::in(['dark', 'light', 'gradient'])],
            'show_signature' => ['required', 'boolean'],
            'signature_name' => ['nullable', 'string', 'max:100'],
            'signature_image' => ['nullable', 'file', 'mimes:png', 'max:2048', new TransparentPng],
            'remove_signature_image' => ['nullable', 'boolean'],
            'custom_title' => ['nullable', 'string', 'max:100'],
            'footer_note' => ['nullable', 'string', 'max:200'],

            'elements' => ['nullable', 'array'],
            'elements.*' => ['nullable', 'array'],
            'elements.*.x' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'elements.*.y' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'elements.*.fontSize' => ['nullable', 'numeric', 'min:6', 'max:120'],
            'elements.*.color' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'elements.*.align' => ['nullable', Rule::in(['left', 'center', 'right'])],
            'elements.*.visible' => ['nullable', 'boolean'],
            'elements.*.text' => ['nullable', 'string', 'max:200'],
            'elements.*.label' => ['nullable', 'string', 'max:40'],
        ]);

        $mode = $validated['mode'] ?? ($current['mode'] ?? 'default');
        $backgroundPath = $current['background_path'] ?? null;
        $signaturePath = is_string($current['signature_image'] ?? null) ? $current['signature_image'] : null;

        if ($request->boolean('remove_signature_image')) {
            if ($signaturePath) {
                Storage::disk('public')->delete($signaturePath);
            }
            $signaturePath = null;
        }

        if ($request->hasFile('signature_image')) {
            if ($signaturePath) {
                Storage::disk('public')->delete($signaturePath);
            }
            $signaturePath = $request->file('signature_image')->store('certificates/signatures', 'public');
        }

        if ($request->boolean('remove_background') && $backgroundPath) {
            Storage::disk('public')->delete($backgroundPath);
            $backgroundPath = null;
        }

        if ($request->hasFile('background_image')) {
            if ($backgroundPath) {
                Storage::disk('public')->delete($backgroundPath);
            }
            $backgroundPath = $request->file('background_image')->store('certificates/templates', 'public');
            $mode = 'custom';
        }

        $elements = $this->certificateService->normalizeElements(
            $validated['elements'] ?? ($current['elements'] ?? [])
        );

        $template = [
            'mode' => $backgroundPath ? 'custom' : 'default',
            'background_path' => $backgroundPath,

            'primary_color' => $validated['primary_color'],
            'accent_color' => $validated['accent_color'],
            'bg_style' => $validated['bg_style'],
            'show_signature' => (bool) $validated['show_signature'],
            'signature_name' => $validated['signature_name'] ?? '',
            'signature_image' => $signaturePath,
            'custom_title' => $validated['custom_title'] ?? '',
            'footer_note' => $validated['footer_note'] ?? '',

            'elements' => $elements,
        ];

        $setting->update(['certificate_template' => $template]);

        // Regenerate all issued certificates since global template changed.
        $certificates = Certificate::query()->whereNotNull('pdf_path')->get();
        foreach ($certificates as $certificate) {
            try {
                $this->certificateService->regenerate($certificate);
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return back()->with('success', 'Certificate template saved successfully.');
    }

    /**
     * Instructor can only update the signature name/image (template layout/design is admin-only).
     */
    public function updateSignature(Request $request, Course $course): RedirectResponse
    {
        $user = $request->user();

        if (! $user || $user->role !== 'instructor' || $course->creator_id !== $user->id) {
            abort(403, 'You are not authorized to update this certificate signature.');
        }

        $validated = $request->validate([
            'signature_name' => ['nullable', 'string', 'max:100'],
            'signature_image' => ['nullable', 'file', 'mimes:png', 'max:2048', new TransparentPng],
            'remove_signature_image' => ['nullable', 'boolean'],
        ]);

        $current = is_array($course->certificate_template) ? $course->certificate_template : [];
        $current['signature_name'] = $validated['signature_name'] ?? '';

        $signaturePath = is_string($current['signature_image'] ?? null) ? $current['signature_image'] : null;

        if ($request->boolean('remove_signature_image')) {
            if ($signaturePath) {
                Storage::disk('public')->delete($signaturePath);
            }
            unset($current['signature_image']);
        }

        if ($request->hasFile('signature_image')) {
            if ($signaturePath) {
                Storage::disk('public')->delete($signaturePath);
            }
            $current['signature_image'] = $request->file('signature_image')->store('certificates/signatures', 'public');
        }

        $course->update(['certificate_template' => $current]);

        $certificates = Certificate::where('course_id', $course->id)->get();
        foreach ($certificates as $certificate) {
            try {
                $this->certificateService->regenerate($certificate);
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return back()->with('success', 'Signature updated successfully.');
    }

    private function authorizeAdmin(Request $request): void
    {
        if ($request->user()?->role !== 'admin') {
            abort(403, 'Only administrators can manage certificate templates.');
        }
    }
}
