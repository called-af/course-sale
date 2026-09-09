<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CertificateTemplateController extends Controller
{
    /**
     * Show certificate template editor for a course.
     * Accessible by: admin (any course), instructor (own course only).
     */
    public function show(Request $request, Course $course): \Inertia\Response
    {
        $this->authorizeAccess($request, $course);

        $template = $course->certificate_template ?? [];

        return Inertia::render('certificate-template/page', [
            'course'   => $course->only('id', 'slug', 'title'),
            'template' => [
                'primary_color'  => $template['primary_color']  ?? '#7c3aed',
                'accent_color'   => $template['accent_color']   ?? '#a78bfa',
                'bg_style'       => $template['bg_style']       ?? 'dark',
                'show_signature' => (bool) ($template['show_signature'] ?? false),
                'signature_name' => $template['signature_name'] ?? '',
                'custom_title'   => $template['custom_title']   ?? '',
                'footer_note'    => $template['footer_note']    ?? '',
            ],
        ]);
    }

    /**
     * Save certificate template settings for a course.
     */
    public function update(Request $request, Course $course): RedirectResponse
    {
        $this->authorizeAccess($request, $course);

        $validated = $request->validate([
            'primary_color'  => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'accent_color'   => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'bg_style'       => ['required', Rule::in(['dark', 'light', 'gradient'])],
            'show_signature' => ['required', 'boolean'],
            'signature_name' => ['nullable', 'string', 'max:100'],
            'custom_title'   => ['nullable', 'string', 'max:100'],
            'footer_note'    => ['nullable', 'string', 'max:200'],
        ]);

        $course->update(['certificate_template' => $validated]);

        return back()->with('success', 'Certificate template saved successfully.');
    }

    /**
     * Authorize: admin = all courses, instructor = own courses only.
     */
    private function authorizeAccess(Request $request, Course $course): void
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            return; // admin bisa semua
        }

        if ($user->role === 'instructor' && $course->creator_id === $user->id) {
            return; // instructor bisa course miliknya
        }

        abort(403, 'You are not authorized to edit this certificate template.');
    }
}
