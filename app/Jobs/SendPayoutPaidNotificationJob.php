<?php

namespace App\Jobs;

use App\Models\AppearanceSetting;
use App\Models\User;
use App\Services\WhatsApp\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SendPayoutPaidNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [30, 60, 120];

    public function __construct(
        public int $instructorId,
        public float $amount,
        public ?string $reference = null,
    ) {}

    public function handle(WhatsAppService $whatsAppService): void
    {
        $instructor = User::find($this->instructorId);

        if (! $instructor || ! $instructor->whatsapp_notification_enabled || empty($instructor->whatsapp_number)) {
            return;
        }

        $dedupKey = 'whatsapp_payout_paid_'.md5($this->instructorId.'|'.$this->amount.'|'.$this->reference);

        if (Cache::has($dedupKey)) {
            return;
        }

        $appName = AppearanceSetting::current()->displayName();
        $amount = 'Rp '.number_format($this->amount, 0, ',', '.');
        $reference = $this->reference ? " (ref: {$this->reference})" : '';
        $account = trim(($instructor->payout_bank_name ?? '').' '.($instructor->payout_account_number_masked ?? ''));

        $message = "Halo {$instructor->name}! Payout sebesar {$amount}{$reference} dari {$appName} sudah ditransfer"
            .($account !== '' ? " ke rekening {$account}" : '').'. Terima kasih.';

        $result = $whatsAppService->sendTextMessage($instructor->whatsapp_number, $message);

        if ($result['success'] ?? false) {
            Cache::put($dedupKey, true, now()->addDays(7));
        } else {
            Log::warning('Failed to send payout paid WhatsApp notification', [
                'instructor_id' => $this->instructorId,
                'error' => $result['error'] ?? 'Unknown error',
            ]);
        }
    }
}
