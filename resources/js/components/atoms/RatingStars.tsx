import clsx from 'clsx';
import { Star } from 'lucide-react';

interface RatingStarsProps {
    value?: number;
    max?: number;
    size?: number;
    className?: string;
}

export default function RatingStars({ value = 0, max = 5, size = 12, className }: RatingStarsProps) {
    return (
        <span className={clsx('inline-flex items-center gap-0.5 text-amber-500 dark:text-amber-400', className)} aria-label={`${value} out of ${max} stars`}>
            {Array.from({ length: max }).map((_, index) => (
                <Star
                    key={index}
                    size={size}
                    className={index < Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}
                />
            ))}
        </span>
    );
}
