<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\UpdateAiCredentialsRequest;
use App\Models\AiSetting;
use App\Models\AiSettingAudit;
use App\Models\RecommendationSetting;
use App\Services\AiSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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
        ]);
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
