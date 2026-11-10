import clsx from 'clsx';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
    dot?: boolean;
    className?: string;
}

export default function Badge({ children, variant = 'default', dot = false, className }: BadgeProps) {
    const variants = {
        default: 'bg-neutral-100 text-neutral-700 dark:bg-[#1e1f24] dark:text-slate-200',
        success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
        warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
        danger: 'bg-rose-100 text-rose-800 dark:bg-red-950/30 dark:text-rose-300',
        info: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300',
        purple: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
    };

    const dotVariants = {
        default: 'bg-neutral-500',
        success: 'bg-emerald-500',
        warning: 'bg-amber-500',
        danger: 'bg-rose-500',
        info: 'bg-sky-500',
        purple: 'bg-purple-500',
    };

    return (
        <span
            className={clsx(
                'inline-flex w-fit items-center gap-2 px-3 py-1 text-xs font-semibold tracking-widest uppercase',
                variants[variant],
                className,
            )}
        >
            {dot && <span className={clsx('h-2 w-2 animate-pulse', dotVariants[variant])} />}
            {children}
        </span>
    );
}
