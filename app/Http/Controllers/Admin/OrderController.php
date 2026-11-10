<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PaymentLog;
use App\Services\Payment\MidtransPaymentGateway;
use App\Services\Payment\PaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService,
    ) {}

    public function index(Request $request): Response
    {
        $statusStats = Order::query()
            ->selectRaw('status, COUNT(*) as total, COALESCE(SUM(total_price), 0) as amount')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $stat = function (string $status) use ($statusStats): array {
            $row = $statusStats->get($status);

            return [
                'count' => (int) ($row?->total ?? 0),
                'amount' => (float) ($row?->amount ?? 0),
            ];
        };

        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->toString();
        $allowedStatuses = ['pending', 'paid', 'failed', 'expired', 'refunded', 'chargeback'];

        $orders = Order::query()
            ->with(['user:id,name,email', 'items.course:id,title,slug,thumbnail', 'items'])
            ->when(in_array($status, $allowedStatuses, true), fn ($query) => $query->where('status', $status))
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search): void {
                $query->where('order_number', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($user) => $user
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%"))
                    ->orWhereHas('items', fn ($item) => $item->where('course_title', 'like', "%{$search}%"));
            }))
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/orders/page', [
            'orders' => $orders,
            'stats' => [
                'revenue' => $stat('paid')['amount'],
                'total_orders' => (int) $statusStats->sum('total'),
                'pending' => $stat('pending'),
                'paid' => $stat('paid'),
                'failed' => $stat('failed'),
                'expired' => $stat('expired'),
                'refunded' => $stat('refunded'),
                'chargeback' => $stat('chargeback'),
            ],
            'filters' => [
                'search' => $search,
                'status' => in_array($status, $allowedStatuses, true) ? $status : null,
            ],
        ]);
    }

    public function show(Order $order): Response
    {
        $order->load([
            'user:id,name,email',
            'items.course:id,title,slug,thumbnail',
            'items',
            'payments.provider',
            'payments.refunds.requester:id,name',
            'payouts.instructor:id,name,email',
        ]);

        return Inertia::render('admin/orders/show', [
            'order' => $order,
            'refundable' => $order->payments->contains(
                fn ($payment) => in_array($payment->status, ['paid', 'partial_refund'], true)
                    && $payment->supportsApiRefund()
            ),
        ]);
    }

    public function markPaid(Request $request, Order $order): RedirectResponse
    {
        if ($order->status === 'paid') {
            return back()->with('info', 'Pesanan ini sudah dibayar.');
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:255'],
            'override' => ['sometimes', 'boolean'],
        ]);

        $payment = $order->payments()->where('status', 'pending')->latest()->first();

        if (! $payment) {
            return back()->with('error', 'Tidak ada transaksi pembayaran yang menunggu konfirmasi.');
        }

        $gatewayStatus = 'unknown';
        $transaction = [];

        if ($payment->provider?->code === 'midtrans') {
            try {
                $result = app(MidtransPaymentGateway::class)->verify($order->order_number);
                $gatewayStatus = (string) ($result['status'] ?? 'unknown');
                $transaction = $result['transaction'] ?? [];
            } catch (\Throwable $exception) {
                report($exception);
                $gatewayStatus = 'error';
            }
        }

        $override = (bool) ($validated['override'] ?? false);

        if ($gatewayStatus !== 'paid' && ! $override) {
            return back()->with(
                'error',
                'Midtrans belum mengonfirmasi pembayaran (status: '.$gatewayStatus.'). Gunakan override dengan alasan jika pembayaran benar-benar diterima.'
            );
        }

        $this->paymentService->markPaid($payment, $transaction);

        PaymentLog::create([
            'payment_id' => $payment->id,
            'event' => $override && $gatewayStatus !== 'paid' ? 'manual_override' : 'manual_confirmed',
            'payload' => [
                'actor_id' => $request->user()?->id,
                'actor_name' => $request->user()?->name,
                'reason' => $validated['reason'],
                'gateway_status' => $gatewayStatus,
                'order_number' => $order->order_number,
            ],
        ]);

        return back()->with('success', 'Pembayaran berhasil dikonfirmasi.');
    }

    public function refund(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
            'amount' => ['nullable', 'numeric', 'min:1'],
        ]);

        if (! in_array($order->status, ['paid', 'chargeback'], true)) {
            return back()->with('error', 'Hanya pesanan yang sudah dibayar yang dapat direfund.');
        }

        $payment = $order->payments()
            ->whereIn('status', ['paid', 'partial_refund'])
            ->latest()
            ->first();

        if (! $payment) {
            return back()->with('error', 'Transaksi pembayaran tidak ditemukan.');
        }

        if (! $payment->supportsApiRefund()) {
            return back()->with(
                'error',
                'Channel '.$payment->payment_type.' tidak mendukung refund API Midtrans. Proses refund manual melalui dashboard Midtrans.'
            );
        }

        try {
            $this->paymentService->refund(
                $payment,
                (string) ($validated['reason'] ?? 'Admin refund request'),
                amount: isset($validated['amount']) ? (float) $validated['amount'] : null,
                meta: ['requested_by' => $request->user()?->id],
            );
        } catch (\Throwable $exception) {
            report($exception);

            Log::warning('Admin refund failed.', [
                'order_number' => $order->order_number,
                'error' => $exception->getMessage(),
            ]);

            return back()->with('error', 'Refund gagal diproses: '.$exception->getMessage());
        }

        return back()->with('success', 'Refund berhasil diproses.');
    }
}
