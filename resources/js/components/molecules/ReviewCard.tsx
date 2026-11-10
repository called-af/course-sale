import { Trash2, UserRound } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/atoms/Button';
import ReviewForm from '@/components/molecules/ReviewForm';
import StarRating from '@/components/molecules/StarRating';
import { apiFetch } from '@/lib/csrf';
import type { Review, RatingStats } from '@/types';

interface ReviewCardProps {
    review: Review;
    courseSlug: string;
    currentUserId?: number;
    isAdmin?: boolean;
    onDeleted?: (reviewId: number, ratingStats: RatingStats) => void;
    onUpdated?: (review: Review, ratingStats: RatingStats) => void;
}

function formatDate(dateStr: string): string {
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(dateStr));
}

export default function ReviewCard({ review, courseSlug, currentUserId, isAdmin, onDeleted, onUpdated }: ReviewCardProps) {
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleted, setDeleted] = useState(false);
    const [currentReview, setCurrentReview] = useState(review);

    const isOwner = currentUserId === review.user.id;

    const handleDelete = async () => {
        if (!confirm('Delete your review? This action cannot be undone.')) return;
        setDeleting(true);

        try {
            const res = await apiFetch(`/student/courses/${courseSlug}/reviews/${review.id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                setDeleted(true);
                onDeleted?.(review.id, data.rating_stats);
            } else {
                alert(data.message ?? 'Failed to delete review.');
            }
        } catch {
            alert('Network error. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    const handleUpdateSuccess = (updated: Review, ratingStats: RatingStats) => {
        setCurrentReview(updated);
        setEditing(false);
        onUpdated?.(updated, ratingStats);
    };

    if (deleted) return null;

    if (editing) {
        return (
            <div className="border border-purple-200 bg-purple-50 p-5 dark:border-purple-900/50 dark:bg-purple-950/40">
                <p className="mb-4 text-sm font-semibold text-purple-700 dark:text-purple-300">Edit your review</p>
                <ReviewForm courseSlug={courseSlug} existing={currentReview} onSuccess={handleUpdateSuccess} onCancel={() => setEditing(false)} />
            </div>
        );
    }

    return (
        <div className="border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-[#1e1f24]">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden bg-purple-100 dark:bg-purple-950/40">
                        {currentReview.user.avatar_url ? (
                            <img src={currentReview.user.avatar_url} alt={currentReview.user.name} className="h-9 w-9 object-cover" />
                        ) : (
                            <UserRound size={18} className="text-purple-600 dark:text-purple-400" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{currentReview.user.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(currentReview.created_at)}</p>
                    </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                    <StarRating value={currentReview.rating} readonly size="sm" />
                    {(isOwner || isAdmin) && (
                        <div className="flex gap-1">
                            {isOwner && (
                                <button
                                    type="button"
                                    onClick={() => setEditing(true)}
                                    className="px-2 py-1 text-xs text-slate-500 transition-colors hover:text-purple-700 dark:text-slate-400 dark:hover:text-purple-400"
                                >
                                    Edit
                                </button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDelete}
                                isLoading={deleting}
                                leftIcon={<Trash2 size={13} />}
                                className="!text-red-500 hover:!bg-red-50 dark:hover:!bg-red-950/30"
                            >
                                Delete
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {currentReview.comment && <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{currentReview.comment}</p>}

            {!currentReview.is_approved && (
                <span className="mt-2 inline-block bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    Pending review
                </span>
            )}
        </div>
    );
}
