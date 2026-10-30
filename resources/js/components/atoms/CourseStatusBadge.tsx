import clsx from 'clsx';

const STATUS_STYLES: Record<string, string> = {
    published:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400',
    review: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400',
    draft: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400',
};

const STATUS_LABELS: Record<string, string> = {
    published: 'Published',
    review: 'In Review',
    draft: 'Draft',
};

interface CourseStatusBadgeProps {
    status: string;
    className?: string;
}

export default function CourseStatusBadge({ status, className }: CourseStatusBadgeProps) {
    return (
        <span
            className={clsx(
                'inline-flex items-center border px-2 py-0.5 text-[10px] font-bold capitalize',
                STATUS_STYLES[status] ?? STATUS_STYLES.draft,
                className,
            )}
        >
            {STATUS_LABELS[status] ?? status}
        </span>
    );
}
