import { useState } from 'react';
import Button from '@/components/atoms/Button';
import StarRating from '@/components/molecules/StarRating';
import { apiFetch } from '@/lib/csrf';
import type { Review, RatingStats } from '@/types';

interface ReviewFormProps {
    courseSlug: string;
    existing?: Review | null;
    onSuccess?: (review: Review, ratingStats: RatingStats) => void;
    onCancel?: () => void;
}

export default function ReviewForm({ courseSlug, existing, onSuccess, onCancel }: ReviewFormProps) {
    const [rating, setRating] = useState(existing?.rating ?? 0);
    const [comment, setComment] = useState(existing?.comment ?? '');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ rating?: string; comment?: string; general?: string }>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (rating === 0) {
            setErrors({ rating: 'Please select a rating before submitting.' });
            return;
        }

        setErrors({});
        setSubmitting(true);

        try {
            const res = await apiFetch(`/student/courses/${courseSlug}/reviews`, {
                method: 'POST',
                body: JSON.stringify({ rating, comment: comment || null }),
            });

            const data = await res.json();

            if (data.success) {
                onSuccess?.(data.review, data.rating_stats);
            } else if (res.status === 422 && data.errors) {
                setErrors(data.errors);
            } else {
                setErrors({ general: data.message ?? 'Something went wrong. Please try again.' });
            }
        } catch {
            setErrors({ general: 'Network error. Please check your connection and try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Your Rating <span className="text-red-500">*</span>
                </label>
                <StarRating
                    value={rating}
                    onChange={(v) => {
                        setRating(v);
                        setErrors({});
                    }}
                    size="lg"
                    showLabel
                />
                {errors.rating && <p className="mt-1.5 text-xs text-red-500">{errors.rating}</p>}
            </div>

            <div>
                <label htmlFor="review-comment" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Your Review <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>
                </label>
                <textarea
                    id="review-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this course..."
                    rows={4}
                    maxLength={2000}
                    className="w-full resize-none border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 transition outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-purple-500 dark:focus:ring-purple-900/50"
                />
                <div className="mt-1 flex justify-between">
                    {errors.comment ? <p className="text-xs text-red-500">{errors.comment}</p> : <span />}
                    <span className="text-xs text-slate-400 dark:text-slate-500">{comment.length}/2000</span>
                </div>
            </div>

            {errors.general && (
                <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-500 dark:border-red-900/50 dark:bg-red-950/30">
                    {errors.general}
                </p>
            )}

            <div className="flex gap-3">
                <Button type="submit" isLoading={submitting} size="md">
                    {existing ? 'Update Review' : 'Submit Review'}
                </Button>
                {onCancel && (
                    <Button type="button" variant="outline" size="md" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
            </div>
        </form>
    );
}
