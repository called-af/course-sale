import Avatar from '@/components/atoms/Avatar';
import RatingStars from '@/components/atoms/RatingStars';
import { formatDate } from '@/lib/dashboard';
import type { RecentReview } from '@/types/dashboard';

interface RecentReviewsListProps {
    reviews: RecentReview[];
}

export default function RecentReviewsList({ reviews }: RecentReviewsListProps) {
    if (reviews.length === 0) {
        return <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">No reviews yet. Keep delivering great lessons!</p>;
    }

    return (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {reviews.map((review) => (
                <div key={review.id} className="py-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                            <Avatar name={review.user?.name} tone="amber" size="sm" />
                            <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{review.user?.name}</p>
                                <p className="truncate text-[10px] text-slate-400 dark:text-slate-500">{review.course?.title}</p>
                            </div>
                        </div>
                        <RatingStars value={review.rating} size={10} />
                    </div>
                    {review.comment && (
                        <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">“{review.comment}”</p>
                    )}
                    <span className="mt-1 block text-[10px] text-slate-400 dark:text-slate-500">{formatDate(review.created_at)}</span>
                </div>
            ))}
        </div>
    );
}
