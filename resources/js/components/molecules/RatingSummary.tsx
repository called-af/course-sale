import StarRating from '@/components/molecules/StarRating';
import type { RatingStats } from '@/types';

interface RatingSummaryProps {
    stats: RatingStats;
}

export default function RatingSummary({ stats }: RatingSummaryProps) {
    return (
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {/* Average Score */}
            <div className="flex shrink-0 flex-col items-center justify-center border border-slate-200 bg-white px-8 py-6 dark:border-slate-700 dark:bg-[#1e1f24]">
                <span className="text-5xl font-extrabold text-slate-900 tabular-nums dark:text-white">{stats.average.toFixed(1)}</span>
                <StarRating value={Math.round(stats.average)} readonly size="md" />
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {stats.total} {stats.total === 1 ? 'review' : 'reviews'}
                </p>
            </div>

            {/* Distribution bars */}
            <div className="flex-1 space-y-1.5">
                {stats.distribution.map((item) => (
                    <div key={item.star} className="flex items-center gap-3">
                        <div className="flex w-12 shrink-0 items-center gap-1">
                            <span className="text-xs font-medium text-slate-600 tabular-nums dark:text-slate-300">{item.star}</span>
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                />
                            </svg>
                        </div>
                        <div className="h-2 flex-1 overflow-hidden bg-slate-100 dark:bg-slate-700">
                            <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${item.percentage}%` }} />
                        </div>
                        <span className="w-10 shrink-0 text-right text-xs text-slate-400 tabular-nums dark:text-slate-500">{item.percentage}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
