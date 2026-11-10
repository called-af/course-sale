<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\Payment\PaymentService;
use Illuminate\Console\Command;

class ExpirePendingOrders extends Command
{
    /**
     * @var string
     */
    protected $signature = 'orders:expire';

    /**
     * @var string
     */
    protected $description = 'Expire pending orders whose payment window has passed';

    public function handle(PaymentService $paymentService): int
    {
        $expired = 0;

        Order::query()
            ->where('status', 'pending')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->chunkById(100, function ($orders) use (&$expired, $paymentService) {
                foreach ($orders as $order) {
                    if ($paymentService->releaseOrder($order, 'expired')) {
                        $expired++;
                    }
                }
            });

        $this->info("Expired {$expired} pending order(s).");

        return self::SUCCESS;
    }
}
