import clsx from 'clsx';
import type { ReactNode } from 'react';

export type StatTone = 'purple' | 'indigo' | 'emerald' | 'amber' | 'rose';

const TONE_STYLES: Record<StatTone, string> = {
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
};

interface StatCardProps {
    icon: ReactNode;
    label: string;
    value: ReactNode;
    subtext?: string;
    tone?: StatTone;
    className?: string;
}

export default function StatCard({ icon, label, value, subtext, tone = 'purple', className }: StatCardProps) {
    return (
        <div
            className={clsx(
                'flex flex-col justify-between border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-700 dark:bg-[#1e1f24]',
                className,
            )}
        >
            <div className="flex items-center justify-between">
                <div className={clsx('flex h-8 w-8 items-center justify-center', TONE_STYLES[tone])}>{icon}</div>
            </div>
            <div className="mt-3">
                <p className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">{value}</p>
                <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
                {subtext && <p className="mt-1 line-clamp-1 text-[11px] text-slate-400 dark:text-slate-500">{subtext}</p>}
            </div>
        </div>
    );
}
