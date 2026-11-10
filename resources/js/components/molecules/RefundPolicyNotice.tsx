import { CalendarClock, Info, ShieldAlert } from 'lucide-react';
import type { RefundPolicy } from '@/types';

function formatDate(value?: string | null): string {
    return value ? new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
}

interface RefundPolicyNoticeProps {
    policy?: RefundPolicy | null;
    /**
     * `panel` renders the full-width learning banner, `compact` renders the
     * small box used in the course detail sidebar.
     */
    variant?: 'panel' | 'compact';
    className?: string;
}

export default function RefundPolicyNotice({ policy, variant = 'panel', className = '' }: RefundPolicyNoticeProps) {
    if (!policy?.applies) {
        return null;
    }

    const eligible = policy.eligible;
    const Icon = eligible ? Info : ShieldAlert;

    const reasons: string[] = [];

    if (!eligible) {
        if (policy.expired) {
            reasons.push(`Masa refund ${policy.window_days} hari sudah berakhir pada ${formatDate(policy.deadline)}.`);
        }

        if (policy.over_progress) {
            reasons.push(
                `Progres belajar sudah ${policy.progress_percent}% (batas refund ${policy.max_progress_percent}%).`,
            );
        }
    }

    const daysLeft = policy.days_left ?? 0;
    const daysLeftLabel = daysLeft > 0 ? `Sisa ${daysLeft} hari` : 'Hari terakhir';

    if (variant === 'compact') {
        return (
            <div
                className={`border p-3 text-xs ${
                    eligible
                        ? 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-200'
                        : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200'
                } ${className}`}
            >
                <p className="flex items-start gap-1.5 font-semibold">
                    <Icon size={14} className="mt-0.5 shrink-0" />
                    {eligible ? `Refund tersedia sampai ${formatDate(policy.deadline)}` : 'Refund sudah tidak dapat diajukan'}
                </p>
                <p className="mt-1 leading-relaxed">
                    {eligible
                        ? `Bisa diajukan selama progres belajar belum melewati ${policy.max_progress_percent}% (sekarang ${policy.progress_percent}%).`
                        : reasons.join(' ')}
                </p>
            </div>
        );
    }

    return (
        <div
            className={`flex flex-col gap-3 border-b px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between ${
                eligible
                    ? 'border-sky-200 bg-sky-50 dark:border-sky-900/50 dark:bg-sky-950/30'
                    : 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30'
            } ${className}`}
        >
            <div className="flex items-start gap-3">
                <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center ${
                        eligible
                            ? 'bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300'
                            : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                >
                    <Icon size={16} />
                </div>
                <div>
                    <p
                        className={`text-xs font-bold ${
                            eligible ? 'text-sky-900 dark:text-sky-200' : 'text-amber-900 dark:text-amber-200'
                        }`}
                    >
                        {eligible ? 'Refund masih tersedia' : 'Refund sudah tidak dapat diajukan'}
                    </p>
                    <p
                        className={`mt-0.5 text-[11px] leading-relaxed ${
                            eligible ? 'text-sky-700 dark:text-sky-300' : 'text-amber-800 dark:text-amber-300'
                        }`}
                    >
                        {eligible
                            ? `Refund dapat diajukan dalam ${policy.window_days} hari sejak enrollment dan selama progres belajar belum melewati ${policy.max_progress_percent}%.`
                            : reasons.join(' ')}
                    </p>
                </div>
            </div>

            {eligible ? (
                <div className="flex shrink-0 flex-wrap items-center gap-2 text-[11px] font-semibold">
                    <span className="inline-flex items-center gap-1 border border-sky-300 bg-white px-2 py-1 text-sky-800 dark:border-sky-800 dark:bg-[#1e1f24] dark:text-sky-200">
                        <CalendarClock size={12} /> {daysLeftLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 border border-sky-300 bg-white px-2 py-1 text-sky-800 dark:border-sky-800 dark:bg-[#1e1f24] dark:text-sky-200">
                        Progres {policy.progress_percent}% / {policy.max_progress_percent}%
                    </span>
                </div>
            ) : null}
        </div>
    );
}
