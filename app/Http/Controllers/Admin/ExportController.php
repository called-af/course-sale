<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use App\Support\CsvExport;
use Illuminate\Http\Request;

class ExportController extends Controller
{
    public function orders()
    {
        $rows = (function () {
            $orders = Order::query()
                ->with(['user:id,name,email', 'items', 'payments' => fn ($query) => $query->latest('id')])
                ->orderBy('id')
                ->cursor();

            foreach ($orders as $order) {
                $payment = $order->payments->first();

                yield [
                    $order->order_number,
                    $order->user?->name,
                    $order->user?->email,
                    $order->items->pluck('course_title')->implode(' | '),
                    $order->total_price,
                    $order->status,
                    $order->refunded_amount,
                    $order->chargeback_amount,
                    $payment?->transaction_id,
                    $payment?->payment_type,
                    $payment?->midtrans_status,
                    $payment?->status_code,
                    $payment?->fraud_status,
                    $payment?->settlement_time?->toDateTimeString(),
                    $order->created_at?->toDateTimeString(),
                    $order->paid_at?->toDateTimeString(),
                    $order->expires_at?->toDateTimeString(),
                ];
            }
        })();

        return CsvExport::download(
            CsvExport::filename('orders'),
            [
                'Order Number',
                'Student',
                'Email',
                'Courses',
                'Total',
                'Status',
                'Refunded Amount',
                'Chargeback Amount',
                'Transaction ID',
                'Payment Type',
                'Midtrans Status',
                'Status Code',
                'Fraud Status',
                'Settlement Time',
                'Created At',
                'Paid At',
                'Expires At',
            ],
            $rows,
        );
    }

    public function users(Request $request)
    {
        $search = $request->string('search')->trim()->toString();
        $role = $request->string('role')->toString();

        $query = User::query();

        if ($search !== '') {
            $query->where(fn ($users) => $users
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%"));
        }

        if (in_array($role, ['admin', 'instructor', 'student'], true)) {
            $query->where('role', $role);
        }

        $rows = (function () use ($query) {
            foreach ($query->orderBy('id')->cursor() as $user) {
                yield [
                    $user->id,
                    $user->name,
                    $user->email,
                    $user->role,
                    $user->email_verified_at?->toDateTimeString(),
                    $user->created_at?->toDateTimeString(),
                ];
            }
        })();

        return CsvExport::download(
            CsvExport::filename('users'),
            ['ID', 'Name', 'Email', 'Role', 'Email Verified At', 'Registered At'],
            $rows,
        );
    }
}
