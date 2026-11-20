<?php

namespace App\Http\Controllers\Instructor;

use App\Http\Controllers\Controller;
use App\Http\Requests\Instructor\UpdateWhatsAppSettingsRequest;
use App\Models\PayoutAccountAudit;
use App\Services\WhatsApp\WhatsAppService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
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
            'payout' => [
                'bank_name' => $user->payout_bank_name ?? '',
                'account_number' => $user->payout_account_number ?? '',
                'account_name' => $user->payout_account_name ?? '',
                'account_number_masked' => $user->payout_account_number_masked,
                'platform_fee_percent' => (float) app(\App\Services\Payment\PaymentSettings::class)->platformFeePercent(),
                'hold_days' => app(\App\Services\Payment\PaymentSettings::class)->payoutHoldDays(),
                'minimum_payout' => app(\App\Services\Payment\PaymentSettings::class)->payoutMinimum(),
                'account_locked_until' => $user->payoutAccountLockedUntil()?->toIso8601String(),
                'pending_total' => (float) $user->payouts()->where('status', 'pending')->sum('net_amount'),
                'available_total' => (float) $user->payouts()->available()->sum('net_amount'),
                'paid_total' => (float) $user->payouts()->where('status', 'paid')->sum('net_amount'),
                'history' => $user->payouts()
                    ->with(['course:id,title,slug', 'order:id,order_number'])
                    ->latest('id')
                    ->limit(20)
                    ->get()
                    ->map(fn ($payout) => [
                        'id' => $payout->id,
                        'status' => $payout->status,
                        'net_amount' => (float) $payout->net_amount,
                        'gross_amount' => (float) $payout->gross_amount,
                        'platform_fee' => (float) $payout->platform_fee,
                        'available_at' => $payout->available_at?->toIso8601String(),
                        'is_available' => $payout->isAvailable(),
                        'reference' => $payout->reference,
                        'paid_at' => $payout->paid_at?->toIso8601String(),
                        'created_at' => $payout->created_at?->toIso8601String(),
                        'course' => $payout->course?->only(['id', 'title', 'slug']),
                        'order_number' => $payout->order?->order_number,
                    ])
                    ->values()
                    ->all(),
            ],
            'payment' => [
                'gateway' => app(\App\Services\Payment\PaymentSettings::class)->current()->gateway,
                'mode' => config('services.payment.midtrans.is_production') ? 'production' : 'sandbox',
            ],
        ]);
    }

    /**
     * Update the instructor's payout bank account (used when Midtrans
     * settlements are transferred to the instructor).
     */
    public function updatePayout(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'bank_name' => ['required', 'string', 'max:60'],
            'account_number' => ['required', 'string', 'max:40', 'regex:/^[0-9\s\-]+$/'],
            'account_name' => ['required', 'string', 'max:120'],
            'current_password' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        $newNumber = preg_replace('/\D+/', '', $validated['account_number']);

        $changedFields = [];

        if (($user->payout_bank_name ?? '') !== $validated['bank_name']) {
            $changedFields[] = 'bank_name';
        }

        if (($user->payout_account_number ?? '') !== $newNumber) {
            $changedFields[] = 'account_number';
        }

        if (($user->payout_account_name ?? '') !== $validated['account_name']) {
            $changedFields[] = 'account_name';
        }

        $isFirstSetup = ! $user->hasCompletePayoutAccount();

        // Changing an existing payout account requires the account password.
        // A hijacked session must not be able to redirect payouts silently.
        if (! $isFirstSetup && $changedFields !== []) {
            $password = (string) ($validated['current_password'] ?? '');

            if ($password === '' || ! Hash::check($password, $user->getAuthPassword())) {
                throw ValidationException::withMessages([
                    'current_password' => 'Masukkan password akun Anda untuk mengubah rekening payout.',
                ]);
            }
        }

        $oldValues = [
            'bank_name' => $user->payout_bank_name,
            'account_number' => $user->payout_account_number_masked,
            'account_name' => $user->payout_account_name,
        ];

        $updates = [
            'payout_bank_name' => $validated['bank_name'],
            'payout_account_number' => $newNumber,
            'payout_account_name' => $validated['account_name'],
        ];

        $accountChanged = $changedFields !== [] && ! $isFirstSetup;

        if ($accountChanged) {
            $updates['payout_account_updated_at'] = now();
        }

        $user->update($updates);

        if ($accountChanged) {
            PayoutAccountAudit::create([
                'user_id' => $user->id,
                'changed_fields' => $changedFields,
                'old_values' => $oldValues,
                'new_values' => [
                    'bank_name' => $validated['bank_name'],
                    'account_number' => $user->payout_account_number_masked,
                    'account_name' => $validated['account_name'],
                ],
                'ip' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 255),
            ]);

            $lockedUntil = $user->payoutAccountLockedUntil();

            return back()->with('success', 'Payout account updated. The account is locked until '
                .($lockedUntil?->translatedFormat('d M Y H:i') ?? '-').' for security reasons.');
        }

        return back()->with('success', 'Instructor payout account saved successfully.');
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

        return back()->with('success', 'WhatsApp notification settings saved successfully.');
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
            return back()->with('error', 'WhatsApp number is empty. Please enter a valid WhatsApp number first.');
        }

        $formattedNumber = $this->whatsAppService->formatPhoneNumber($targetNumber);
        if (strlen($formattedNumber) < 9 || strlen($formattedNumber) > 16) {
            return back()->with('error', 'Invalid WhatsApp number format. Use a valid format (e.g. 081234567890 or +6281234567890).');
        }

        $result = $this->whatsAppService->sendTestNotification($user, $formattedNumber);

        if ($result['success']) {
            if (! empty($result['is_simulated'])) {
                return back()->with('success', 'Simulation mode: '.($result['message'] ?? 'Test message simulated successfully.'));
            }

            if (! empty($result['notice'])) {
                return back()->with('success', 'Test message sent to '.$formattedNumber.'. '.$result['notice']);
            }

            return back()->with('success', 'WhatsApp test message sent to '.$formattedNumber.'!');
        }

        return back()->with('error', 'Failed to send test message: '.($result['error'] ?? 'An error occurred with the Meta Cloud API.'));
    }
}
