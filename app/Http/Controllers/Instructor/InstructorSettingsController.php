<?php

namespace App\Http\Controllers\Instructor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Instructor\UpdateWhatsAppSettingsRequest;
use App\Services\WhatsApp\WhatsAppService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstructorSettingsController extends Controller
{
    public function __construct(
        protected WhatsAppService $whatsAppService
    ) {}

    /**
     * Display instructor settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('instructor/settings/General', [
            'settings' => [
                'whatsapp_number' => $user->whatsapp_number ?? '',
                'whatsapp_notification_enabled' => (bool) $user->whatsapp_notification_enabled,
                'is_configured' => $this->whatsAppService->isConfigured(),
                'provider' => $this->whatsAppService->getProvider(),
                'is_local' => app()->isLocal(),
            ],
        ]);
    }

    /**
     * Update instructor's own WhatsApp notification settings.
     */
    public function updateWhatsApp(UpdateWhatsAppSettingsRequest $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validated();

        $formattedNumber = ! empty($validated['whatsapp_number'])
            ? $this->whatsAppService->formatPhoneNumber($validated['whatsapp_number'])
            : null;

        // Ensure user can only update their own record
        $user->update([
            'whatsapp_number' => $formattedNumber,
            'whatsapp_notification_enabled' => (bool) $validated['whatsapp_notification_enabled'],
        ]);

        return back()->with('success', 'Pengaturan notifikasi WhatsApp berhasil disimpan.');
    }

    /**
     * Send a test WhatsApp notification to the instructor.
     */
    public function testWhatsApp(Request $request): RedirectResponse
    {
        $user = $request->user();
        $inputNumber = $request->input('whatsapp_number');
        $targetNumber = ! empty($inputNumber) ? $inputNumber : $user->whatsapp_number;

        if (empty($targetNumber)) {
            return back()->with('error', 'Nomor WhatsApp belum diisi. Masukkan nomor WhatsApp yang valid terlebih dahulu.');
        }

        $formattedNumber = $this->whatsAppService->formatPhoneNumber($targetNumber);
        if (strlen($formattedNumber) < 9 || strlen($formattedNumber) > 16) {
            return back()->with('error', 'Format nomor WhatsApp tidak valid. Gunakan format yang valid (contoh: 081234567890 atau +6281234567890).');
        }

        $result = $this->whatsAppService->sendTestNotification($user, $formattedNumber);

        if ($result['success']) {
            if (! empty($result['is_simulated'])) {
                return back()->with('success', 'Mode Simulasi: ' . ($result['message'] ?? 'Pesan uji coba berhasil disimulasikan.'));
            }

            if (! empty($result['notice'])) {
                return back()->with('success', 'Pesan uji coba berhasil dikirim ke ' . $formattedNumber . '. ' . $result['notice']);
            }

            return back()->with('success', 'Pesan uji coba WhatsApp berhasil dikirim ke ' . $formattedNumber . '!');
        }

        return back()->with('error', 'Gagal mengirim pesan uji coba: ' . ($result['error'] ?? 'Terjadi kesalahan pada Meta Cloud API.'));
    }
}
