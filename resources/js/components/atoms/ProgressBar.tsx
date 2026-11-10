import clsx from 'clsx';

export type ProgressTone = 'purple' | 'emerald' | 'indigo' | 'amber';

const TONE_STYLES: Record<ProgressTone, string> = {
    purple: 'bg-purple-600',
    emerald: 'bg-emerald-500',
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-500',
};

interface ProgressBarProps {
    value: number;
    tone?: ProgressTone;
    className?: string;
    barClassName?: string;
}

export default function ProgressBar({ value, tone = 'purple', className, barClassName }: ProgressBarProps) {
    const safeValue = Math.min(100, Math.max(0, value ?? 0));

    return (
        <div className={clsx('h-1.5 w-full overflow-hidden bg-slate-100 dark:bg-[#1e1f24]', className)}>
            <div className={clsx('h-full transition-all duration-300', TONE_STYLES[tone], barClassName)} style={{ width: `${safeValue}%` }} />
        </div>
    );
}
