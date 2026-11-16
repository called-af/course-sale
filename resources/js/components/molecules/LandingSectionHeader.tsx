import clsx from 'clsx';

import Badge from '@/components/atoms/Badge';
import Title from '@/components/atoms/Title';

interface LandingSectionHeaderProps {
    badge: string;
    titleLead: string;
    titleHighlight: string;
    titleTail?: string;
    description?: string;
    align?: 'left' | 'center';
    className?: string;
    titleClassName?: string;
    descriptionClassName?: string;
}

/**
 * Shared header for landing sections: badge, highlighted title and an optional
 * description. Keeps every section visually consistent.
 */
export default function LandingSectionHeader({
    badge,
    titleLead,
    titleHighlight,
    titleTail = '',
    description,
    align = 'left',
    className,
    titleClassName,
    descriptionClassName,
}: LandingSectionHeaderProps) {
    return (
        <div className={clsx('flex flex-col gap-4', align === 'center' && 'items-center text-center', className)}>
            <Badge variant="purple" dot>
                {badge}
            </Badge>

            <Title as="h2" className={clsx('leading-tight', titleClassName)} style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>
                {titleLead}
                <span className="relative isolate inline-block bg-purple-400 px-2">
                    <span
                        aria-hidden
                        className="pointer-events-none absolute -inset-x-8 -inset-y-6 -z-10 rounded-full bg-purple-400/25 blur-2xl dark:bg-purple-500/25"
                    />
                    {titleHighlight}
                </span>
                {titleTail}
            </Title>

            {description && (
                <p className={clsx('max-w-md text-sm leading-relaxed text-gray-500 dark:text-slate-400', descriptionClassName)}>{description}</p>
            )}
        </div>
    );
}
