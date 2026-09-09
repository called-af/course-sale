import { useState } from 'react'
import clsx from 'clsx'

interface StarRatingProps {
    value?: number
    onChange?: (rating: number) => void
    readonly?: boolean
    size?: 'sm' | 'md' | 'lg'
    showLabel?: boolean
}

const LABELS: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
}

const SIZE_MAP = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
}

export default function StarRating({
    value = 0,
    onChange,
    readonly = false,
    size = 'md',
    showLabel = false,
}: StarRatingProps) {
    const [hovered, setHovered] = useState(0)
    const effective = hovered || value

    return (
        <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        disabled={readonly}
                        onClick={() => onChange?.(star)}
                        onMouseEnter={() => !readonly && setHovered(star)}
                        onMouseLeave={() => !readonly && setHovered(0)}
                        className={clsx(
                            'transition-transform',
                            !readonly && 'cursor-pointer hover:scale-110 active:scale-95',
                            readonly && 'cursor-default',
                        )}
                        aria-label={`${star} star`}
                    >
                        <svg
                            className={clsx(SIZE_MAP[size], 'transition-colors')}
                            viewBox="0 0 24 24"
                            fill={star <= effective ? '#f59e0b' : 'none'}
                            stroke={star <= effective ? '#f59e0b' : '#d1d5db'}
                            strokeWidth="1.5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                            />
                        </svg>
                    </button>
                ))}
            </div>
            {showLabel && effective > 0 && (
                <span className="text-sm font-medium text-amber-600">{LABELS[effective]}</span>
            )}
            {showLabel && effective === 0 && !readonly && (
                <span className="text-sm text-slate-400">Select a rating</span>
            )}
        </div>
    )
}
