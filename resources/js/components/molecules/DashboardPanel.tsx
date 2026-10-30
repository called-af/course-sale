import clsx from 'clsx';
import type { ReactNode } from 'react';

interface DashboardPanelProps {
    title?: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    headerClassName?: string;
    bodyClassName?: string;
    iconClassName?: string;
}

export default function DashboardPanel({
    title,
    description,
    icon,
    action,
    children,
    className,
    headerClassName,
    bodyClassName,
    iconClassName,
}: DashboardPanelProps) {
    const hasHeader = Boolean(title || description || icon || action);

    return (
        <section
            className={clsx(
                'border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-800',
                className,
            )}
        >
            {hasHeader && (
                <div
                    className={clsx(
                        'flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 pb-4 sm:px-6 dark:border-slate-700',
                        headerClassName,
                    )}
                >
                    <div className="flex items-start gap-2.5">
                        {icon && (
                            <div
                                className={clsx(
                                    'flex h-7 w-7 shrink-0 items-center justify-center bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
                                    iconClassName,
                                )}
                            >
                                {icon}
                            </div>
                        )}
                        <div>
                            {title && <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h2>}
                            {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
                        </div>
                    </div>
                    {action}
                </div>
            )}

            <div className={clsx(hasHeader && 'p-5 sm:p-6', bodyClassName)}>{children}</div>
        </section>
    );
}
