<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\UpdateAiCredentialsRequest;
use App\Http\Requests\UpdateWhatsAppCredentialsRequest;
use App\Models\AiSetting;
use App\Models\AiSettingAudit;
use App\Models\AppearanceSetting;
use App\Models\RecommendationSetting;
use App\Models\WhatsAppSetting;
use App\Services\AiSettings;
use App\Services\WhatsApp\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class GeneralSettingsController extends \App\Http\Controllers\Controller
{
    public function edit(): \Inertia\Response
    {
        $this->authorize('manage-settings');

        return Inertia::render('admin/settings/General', [
            'ai' => app(AiSettings::class)->forDisplay(),
            'recommendation' => [
                'enabled' => RecommendationSetting::isEnabled(),
            ],
            'whatsapp' => WhatsAppSetting::current()->forDisplay(),
        ]);
    }

    public function updateAppearance(Request $request): RedirectResponse
    {
        $this->authorize('manage-settings');

        $validated = $request->validate([
            'palette' => ['required', 'string', Rule::in(AppearanceSetting::PALETTES)],
        ]);

        AppearanceSetting::current()->forceFill($validated)->save();

        return back()->with('success', 'Palet tampilan berhasil disimpan.');
    }

    public function updateIdentity(Request $request): RedirectResponse
    {
        $this->authorize('manage-settings');

        $validated = $request->validate([
            'app_name' => ['required', 'string', 'max:60'],
            'contact_email' => ['nullable', 'email', 'max:120'],
        ]);

        AppearanceSetting::current()->forceFill($validated)->save();

        return back()->with('success', 'Identitas aplikasi berhasil disimpan.');
    }

    public function updateLogo(Request $request): RedirectResponse
    {
        $this->authorize('manage-settings');

        $request->validate([
            'logo' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,svg', 'max:2048'],
        ]);

        $setting = AppearanceSetting::current();
        $oldLogo = $setting->logo_path;

        $path = $request->file('logo')->store('branding', 'public');

        $setting->forceFill(['logo_path' => $path])->save();

        if ($oldLogo && $oldLogo !== $path) {
            Storage::disk('public')->delete($oldLogo);
        }

        return back()->with('success', 'Logo aplikasi berhasil diperbarui.');
    }

    public function destroyLogo(): RedirectResponse
    {
        $this->authorize('manage-settings');

        $setting = AppearanceSetting::current();

        if ($setting->logo_path) {
            Storage::disk('public')->delete($setting->logo_path);
        }

        $setting->forceFill(['logo_path' => null])->save();

        return back()->with('success', 'Logo aplikasi dikembalikan ke default.');
    }

    public function verifyPassword(Request $request): JsonResponse
    {
        $this->authorize('manage-settings');

        $currentPassword = (string) $request->input('current_password', '');
        $isValid = ! empty($currentPassword)
            && Hash::check($currentPassword, $request->user()->getAuthPassword());

        if (! $isValid) {
            return response()->json([
                'errors' => ['current_password' => 'Password yang dimasukkan salah.'],
            ], 422);
        }

        return response()->json(['success' => true]);
    }

    public function toggleAi(Request $request): RedirectResponse
    {
        $this->authorize('manage-settings');

        $service = app(AiSettings::class);
        $enabled = (bool) $request->input('enabled', false);
        $result = $service->setEnabled($enabled);

        $this->recordAudit($request, ['enabled']);

        return back()->with('success', $result
            ? 'Fitur AI diaktifkan.'
            : 'Fitur AI dimatikan.');
    }

    public function toggleRecommendation(Request $request): RedirectResponse
    {
        $this->authorize('manage-settings');

        $enabled = (bool) $request->input('enabled', false);
        $setting = RecommendationSetting::current();
        $setting->forceFill(['enabled' => $enabled])->save();

        return back()->with('success', $enabled
            ? 'Rekomendasi Python AI diaktifkan.'
            : 'Rekomendasi Python AI dimatikan.');
    }

    public function updateAi(UpdateAiCredentialsRequest $request): RedirectResponse
    {
        $this->authorize('manage-settings');

        $service = app(AiSettings::class);
        $changedFields = [];

        if ($request->input('base_url') !== AiSetting::current()->base_url) {
            $changedFields[] = 'base_url';
        }

        if ($request->input('model') !== AiSetting::current()->model) {
            $changedFields[] = 'model';
        }

        if (! empty($request->input('api_key'))) {
            $changedFields[] = 'api_key';
        }

        $service->saveCredentials($request->validated());
        $this->recordAudit($request, $changedFields);

        return back()->with('success', 'Konfigurasi AI disimpan.');
    }

    public function toggleWhatsapp(Request $request): RedirectResponse
    {
        $this->authorize('manage-settings');

        $enabled = (bool) $request->input('enabled', false);
        $setting = WhatsAppSetting::current();
        $setting->forceFill(['enabled' => $enabled])->save();

        app(WhatsAppService::class)->loadConfiguration();

        return back()->with('success', $enabled
            ? 'Notifikasi WhatsApp diaktifkan.'
            : 'Notifikasi WhatsApp dimatikan.');
    }

    public function updateWhatsapp(UpdateWhatsAppCredentialsRequest $request): RedirectResponse
    {
        $this->authorize('manage-settings');

        $validated = $request->validated();
        $setting = WhatsAppSetting::current();

        $setting->base_url = $validated['base_url'];
        $setting->from_number = $validated['from_number'];
        $setting->sandbox_keyword = $validated['sandbox_keyword'] ?? null;

        if (! empty($validated['api_key'])) {
            $setting->api_key = $validated['api_key'];
        }

        $setting->save();

        app(WhatsAppService::class)->loadConfiguration();

        return back()->with('success', 'Konfigurasi WhatsApp Infobip berhasil disimpan.');
    }

    public function testWhatsapp(Request $request, WhatsAppService $whatsAppService): JsonResponse
    {
        $this->authorize('manage-settings');

        $request->validate([
            'phone_number' => ['required', 'string'],
        ]);

        $recipient = $whatsAppService->formatPhoneNumber($request->input('phone_number'));
        if (empty($recipient)) {
            return response()->json([
                'success' => false,
                'error' => 'Format nomor WhatsApp tidak valid.',
            ], 422);
        }

        $appName = AppearanceSetting::current()->displayName();
        $time = now()->translatedFormat('d M Y, H:i');
        $message = "Halo! Ini adalah pesan uji coba (Test WhatsApp) dari Admin Panel {$appName} via Infobip Gateway.\n\nWaktu: {$time}\nStatus: Konfigurasi DB Aktif & Terhubung.";

        $result = $whatsAppService->sendInfobipTextMessage($recipient, $message);

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    private function recordAudit(Request $request, array $fields): void
    {
        AiSettingAudit::create([
            'ai_setting_id' => 1,
            'user_id' => $request->user()->id,
            'ip' => $request->ip(),
            'changed_fields' => array_values(array_unique($fields)),
        ]);
    }
}
