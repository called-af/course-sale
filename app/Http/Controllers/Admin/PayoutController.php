<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendPayoutPaidNotificationJob;
use App\Models\InstructorPayout;
use App\Models\User;
use App\Services\Payment\PaymentSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PayoutController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->toString();
        $allowedStatuses = ['pending', 'paid', 'cancelled'];

        $stats = InstructorPayout::query()
            ->selectRaw('status, COUNT(*) as total, COALESCE(SUM(net_amount), 0) as amount')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $settings = $this->payoutSettings();

        // Aggregate every payable ledger per instructor so the admin can send
        // one transfer per instructor instead of one per course sale.
        $availableRows = InstructorPayout::query()
            ->available()
            ->with([
                'instructor:id,name,email,payout_bank_name,payout_account_name,payout_account_number,payout_account_updated_at',
            ])
            ->get()
            ->groupBy('instructor_id');

        $readiness = $availableRows->map(function ($rows) use ($settings): array {
            return $this->instructorState($rows->first()->instructor, (float) $rows->sum('net_amount'), $settings['minimum']);
        });

        $batches = $availableRows
            ->map(function ($rows, $instructorId) use ($readiness): array {
                $instructor = $rows->first()->instructor;
                $state = $readiness[$instructorId];

                return array_merge([
                    'instructor_id' => (int) $instructorId,
                    'instructor' => $this->instructorPayload($instructor),
                    'payout_ids' => $rows->pluck('id')->values()->all(),
                    'count' => $rows->count(),
                    'net_total' => (float) $rows->sum('net_amount'),
                    'earliest_available_at' => $rows->min('available_at')?->toIso8601String(),
                ], $state);
            })
            ->sortByDesc('net_total')
            ->values();

        $payouts = InstructorPayout::query()
            ->with([
                'instructor:id,name,email,payout_bank_name,payout_account_name,payout_account_number,payout_account_updated_at',
                'order:id,order_number,status',
                'course:id,title,slug',
            ])
            ->when(in_array($status, $allowedStatuses, true), fn ($query) => $query->where('status', $status))
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search): void {
                $query->whereHas('instructor', fn ($instructor) => $instructor
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%"))
                    ->orWhereHas('order', fn ($order) => $order->where('order_number', 'like', "%{$search}%"))
                    ->orWhereHas('course', fn ($course) => $course->where('title', 'like', "%{$search}%"));
            }))
            ->latest('id')
            ->paginate(15)
            ->withQueryString()
            ->through(function (InstructorPayout $payout) use ($readiness, $settings): array {
                $state = $readiness[$payout->instructor_id] ?? $this->instructorState($payout->instructor, 0.0, $settings['minimum']);

                if ($payout->status === 'pending' && ! $payout->isAvailable()) {
                    $state['ready'] = false;
                    $state['reason'] = 'Payout baru tersedia pada '
                        .($payout->available_at?->translatedFormat('d M Y H:i') ?? '-').'.';
                }

                return [
                    'id' => $payout->id,
                    'status' => $payout->status,
                    'gross_amount' => (float) $payout->gross_amount,
                    'platform_fee' => (float) $payout->platform_fee,
                    'net_amount' => (float) $payout->net_amount,
                    'reference' => $payout->reference,
                    'notes' => $payout->notes,
                    'available_at' => $payout->available_at?->toIso8601String(),
                    'is_available' => $payout->isAvailable(),
                    'paid_at' => $payout->paid_at?->toIso8601String(),
                    'created_at' => $payout->created_at?->toIso8601String(),
                    'instructor' => $this->instructorPayload($payout->instructor),
                    'order' => $payout->order?->only(['id', 'order_number', 'status']),
                    'course' => $payout->course?->only(['id', 'title', 'slug']),
                    'instructor_state' => $state,
                ];
            });

        return Inertia::render('admin/payouts/page', [
            'payouts' => $payouts,
            'batches' => $batches,
            'stats' => [
                'pending' => [
                    'count' => (int) ($stats->get('pending')?->total ?? 0),
                    'amount' => (float) ($stats->get('pending')?->amount ?? 0),
                ],
                'paid' => [
                    'count' => (int) ($stats->get('paid')?->total ?? 0),
                    'amount' => (float) ($stats->get('paid')?->amount ?? 0),
                ],
                'cancelled' => [
                    'count' => (int) ($stats->get('cancelled')?->total ?? 0),
                    'amount' => (float) ($stats->get('cancelled')?->amount ?? 0),
                ],
            ],
            'platform_fee_percent' => $settings['fee_percent'],
            'payout_settings' => $settings,
            'filters' => [
                'search' => $search,
                'status' => in_array($status, $allowedStatuses, true) ? $status : null,
            ],
        ]);
    }

    public function markPaid(Request $request, InstructorPayout $payout): RedirectResponse
    {
        if ($payout->status !== 'pending') {
            return back()->with('error', 'Payout ini tidak berstatus pending.');
        }

        if (! $payout->isAvailable()) {
            return back()->with('error', 'Payout belum bisa dicairkan. Tersedia pada '
                .($payout->available_at?->translatedFormat('d M Y H:i') ?? '-').'.');
        }

        $settings = $this->payoutSettings();
        $availableTotal = (float) InstructorPayout::query()
            ->available()
            ->where('instructor_id', $payout->instructor_id)
            ->sum('net_amount');

        $state = $this->instructorState($payout->instructor, $availableTotal, $settings['minimum']);

        if (! $state['ready']) {
            return back()->with('error', $state['reason'] ?? 'Payout belum siap ditransfer.');
        }

        $validated = $request->validate([
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $payout->update([
            'status' => 'paid',
            'paid_at' => now(),
            'reference' => $validated['reference'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        SendPayoutPaidNotificationJob::dispatch(
            $payout->instructor_id,
            (float) $payout->net_amount,
            $payout->reference,
        );

        return back()->with('success', 'Payout instruktur ditandai sudah ditransfer.');
    }

    public function markBatchPaid(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'instructor_id' => ['required', 'integer', 'exists:users,id'],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $settings = $this->payoutSettings();

        $result = DB::transaction(function () use ($validated, $settings): array {
            $payouts = InstructorPayout::query()
                ->available()
                ->with('instructor')
                ->where('instructor_id', $validated['instructor_id'])
                ->lockForUpdate()
                ->get();

            if ($payouts->isEmpty()) {
                return ['error' => 'Tidak ada payout yang siap ditransfer untuk instruktur ini.'];
            }

            $instructor = $payouts->first()->instructor;
            $total = (float) $payouts->sum('net_amount');
            $state = $this->instructorState($instructor, $total, $settings['minimum']);

            if (! $state['ready']) {
                return ['error' => $state['reason'] ?? 'Batch payout belum siap ditransfer.'];
            }

            $reference = $validated['reference'] ?? 'BATCH-'.now()->format('YmdHis').'-'.$instructor->id;

            InstructorPayout::query()
                ->whereKey($payouts->pluck('id'))
                ->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                    'reference' => $reference,
                    'notes' => $validated['notes'] ?? null,
                ]);

            return [
                'instructor_id' => $instructor->id,
                'total' => $total,
                'reference' => $reference,
                'count' => $payouts->count(),
            ];
        });

        if (isset($result['error'])) {
            return back()->with('error', $result['error']);
        }

        SendPayoutPaidNotificationJob::dispatch(
            $result['instructor_id'],
            $result['total'],
            $result['reference'],
        );

        return back()->with('success', 'Batch payout ('.$result['count'].' ledger) berhasil ditandai sudah ditransfer.');
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $settings = $this->payoutSettings();

        $rows = InstructorPayout::query()
            ->available()
            ->with('instructor')
            ->get()
            ->groupBy('instructor_id')
            ->map(function ($instructorRows) use ($settings): ?array {
                $instructor = $instructorRows->first()->instructor;
                $total = (float) $instructorRows->sum('net_amount');
                $state = $this->instructorState($instructor, $total, $settings['minimum']);

                if (! $state['ready']) {
                    return null;
                }

                return [
                    'name' => $instructor->name,
                    'bank' => $instructor->payout_bank_name,
                    'account_number' => (string) $instructor->payout_account_number,
                    'account_name' => $instructor->payout_account_name,
                    'count' => $instructorRows->count(),
                    'total' => $total,
                ];
            })
            ->filter()
            ->values();

        Log::info('Instructor payout CSV exported', [
            'admin_id' => $request->user()?->id,
            'instructors' => $rows->count(),
        ]);

        $filename = 'payout-'.now()->format('Ymd-His').'.csv';

        return response()->streamDownload(function () use ($rows): void {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Nama Instruktur', 'Bank', 'No Rekening', 'Atas Nama', 'Jumlah Ledger', 'Total Net', 'Referensi']);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['name'],
                    $row['bank'],
                    $row['account_number'],
                    $row['account_name'],
                    $row['count'],
                    number_format($row['total'], 2, '.', ''),
                    '',
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * @return array{fee_percent: float, hold_days: int, minimum: float, account_lock_hours: int}
     */
    protected function payoutSettings(): array
    {
        $settings = app(PaymentSettings::class);

        return [
            'fee_percent' => $settings->platformFeePercent(),
            'hold_days' => $settings->payoutHoldDays(),
            'minimum' => $settings->payoutMinimum(),
            'account_lock_hours' => $settings->payoutAccountLockHours(),
        ];
    }

    /**
     * @return array{bank_complete: bool, locked_until: string|null, meets_minimum: bool, ready: bool, reason: string|null}
     */
    protected function instructorState(?User $instructor, float $availableTotal, float $minimum): array
    {
        $bankComplete = $instructor?->hasCompletePayoutAccount() ?? false;
        $lockedUntil = $instructor?->payoutAccountLockedUntil();
        $meetsMinimum = $availableTotal >= $minimum;

        $reason = null;

        if (! $bankComplete) {
            $reason = 'Rekening instruktur belum lengkap.';
        } elseif ($lockedUntil) {
            $reason = 'Rekening baru diubah, terkunci sampai '.$lockedUntil->translatedFormat('d M Y H:i').'.';
        } elseif (! $meetsMinimum) {
            $reason = 'Total payout belum mencapai minimum Rp '.number_format($minimum, 0, ',', '.').'.';
        }

        return [
            'bank_complete' => $bankComplete,
            'locked_until' => $lockedUntil?->toIso8601String(),
            'meets_minimum' => $meetsMinimum,
            'ready' => $bankComplete && ! $lockedUntil && $meetsMinimum,
            'reason' => $reason,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function instructorPayload(?User $instructor): array
    {
        return [
            'id' => $instructor?->id,
            'name' => $instructor?->name,
            'email' => $instructor?->email,
            'bank_name' => $instructor?->payout_bank_name,
            'account_name' => $instructor?->payout_account_name,
            'account_number_masked' => $instructor?->payout_account_number_masked,
        ];
    }
}
