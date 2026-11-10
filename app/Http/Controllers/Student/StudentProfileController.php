<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UpdateUserRequest;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentProfileController extends Controller
{
    public function __construct(
        protected UserService $userService
    ) {}

    public function edit(): Response
    {
        return Inertia::render('student/profile/page', [
            'user' => request()->user()->load([
                'createdCourses' => fn ($courses) => $courses->withCount(['modules', 'enrollments'])
                    ->with(['categories:id,name', 'creator:id,name'])->latest(),
                'enrollments' => fn ($enrollments) => $enrollments
                    ->with(['course:id,title,slug,thumbnail'])
                    ->latest('enrolled_at')
                    ->get(),
            ]),
        ]);
    }

    public function update(UpdateUserRequest $request): RedirectResponse
    {
        $this->userService->update($request->user(), $request->validated());

        return redirect()
            ->route('student.profile')
            ->with('success', 'Profil berhasil diperbarui.');
    }

    public function settings(): Response
    {
        $user = request()->user();

        return Inertia::render('student/settings/page', [
            'whatsapp' => [
                'whatsapp_number' => $user->whatsapp_number ?? '',
                'whatsapp_notification_enabled' => (bool) $user->whatsapp_notification_enabled,
                'is_configured' => app(\App\Services\WhatsApp\WhatsAppService::class)->isConfigured(),
                'provider' => app(\App\Services\WhatsApp\WhatsAppService::class)->getProvider(),
                'is_local' => app()->isLocal(),
            ],
        ]);
    }

    public function updateWhatsApp(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'whatsapp_notification_enabled' => ['required', 'boolean'],
            'whatsapp_number' => ['nullable', 'string', 'max:25', 'required_if:whatsapp_notification_enabled,true'],
        ]);

        $cleaned = preg_replace('/[\s\-()]+/', '', trim((string) ($validated['whatsapp_number'] ?? '')));
        $formatted = ($cleaned && strlen($cleaned) >= 9 && strlen($cleaned) <= 16) ? $cleaned : null;

        $user->update([
            'whatsapp_number' => $formatted,
            'whatsapp_notification_enabled' => (bool) $validated['whatsapp_notification_enabled'],
        ]);

        return back()->with('success', 'Pengaturan notifikasi WhatsApp berhasil disimpan.');
    }
}
