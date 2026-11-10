<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Services\Payment\MidtransPaymentGateway;
use App\Services\Payment\PaymentService;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService,
    ) {}

    public function show(Order $order): Response
    {
        $this->authorizeOrder($order);

        $payment = Payment::with(['order.user:id,name,email', 'order.items.course:id,title,slug', 'provider'])
            ->where('order_id', $order->id)
            ->latest()
            ->firstOrFail();

        if ($payment->status === 'pending' && $payment->provider?->code === 'midtrans') {
            try {
                $result = app(MidtransPaymentGateway::class)->verify($order->order_number);
                $status = $result['status'] ?? 'pending';

                if ($status === 'paid') {
                    $order = $this->paymentService->markPaid($payment, $result['transaction'] ?? []);
                } elseif (in_array($status, ['expired', 'failed'], true)) {
                    $this->paymentService->markUnpaid($payment, $status, $result['transaction'] ?? []);
                    $order->refresh();
                } elseif ($status === 'chargeback') {
                    $this->paymentService->handleChargeback($payment, 0, $result['raw'] ?? []);
                    $order->refresh();
                }

                $payment->refresh();
            } catch (\Throwable $exception) {
                // A gateway outage must not break the payment page. The
                // webhook remains the source of truth for the final status.
                report($exception);

                Log::warning('Could not refresh Midtrans status from the payment page.', [
                    'order_number' => $order->order_number,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        $course = $order->items->first()?->course;
        $hasOnlineGateway = $payment->payment_url && str_starts_with((string) $payment->payment_url, 'http');

        return Inertia::render('student/payment/page', [
            'order' => $order->only([
                'id',
                'order_number',
                'total_price',
                'refunded_amount',
                'chargeback_amount',
                'status',
                'currency',
                'expires_at',
                'paid_at',
            ]),
            'payment' => $payment->only([
                'id',
                'status',
                'amount',
                'currency',
                'reference',
                'payment_url',
                'payment_type',
                'transaction_id',
                'refunded_amount',
                'chargeback_amount',
                'paid_at',
            ]),
            'course' => $course,
            'gateway' => [
                'payment_url' => $hasOnlineGateway ? $payment->payment_url : null,
            ],
        ]);
    }

    private function authorizeOrder(?Order $order): void
    {
        abort_unless($order !== null, 404);

        $user = request()->user();

        abort_unless($user !== null && ($order->user_id === $user->id || $user->role === 'admin'), 403);
    }
}
