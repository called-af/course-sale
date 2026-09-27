import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, BookOpen, CheckCircle2, Clock3, Layers, Lock, MessageSquare, PlayCircle, Star, UserRound } from 'lucide-react';
import { useState } from 'react';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import WelcomeLayout from '@/components/templates/WelcomeLayout';
import StarRating from '@/components/molecules/StarRating';
import ReviewForm from '@/components/molecules/ReviewForm';
import ReviewCard from '@/components/molecules/ReviewCard';
import RatingSummary from '@/components/molecules/RatingSummary';
import CommentThread from '@/components/molecules/CommentThread';
import type { Course, Review, RatingStats, Comment } from '@/types';

interface CourseDetailPageProps {
    course: Course;
    isEnrolled: boolean;
    canReview?: boolean;
    progressPercent?: number;
    completedCount?: number;
    totalMaterials?: number;
    reviews: Review[];
    ratingStats: RatingStats;
    userReview?: Review | null;
    comments: Comment[];
}

export default function CourseDetailPage({
    course,
    isEnrolled,
    canReview = false,
    progressPercent = 0,
    completedCount = 0,
    totalMaterials = 0,
    reviews: initialReviews,
    ratingStats: initialStats,
    userReview: initialUserReview,
    comments,
}: CourseDetailPageProps) {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const [processing, setProcessing] = useState(false);

    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [ratingStats, setRatingStats] = useState<RatingStats>(initialStats);
    const [userReview, setUserReview] = useState<Review | null>(initialUserReview ?? null);

    const enroll = () => {
        setProcessing(true);
        router.post(
            `/course/${course.slug}/enroll`,
            {},
            { onFinish: () => setProcessing(false) },
        );
    };

    const handleReviewSuccess = (review: Review, stats: RatingStats) => {
        setRatingStats(stats);
        setUserReview(review);
        setReviews((prev) => {
            const exists = prev.find((r) => r.id === review.id);
            if (exists) return prev.map((r) => (r.id === review.id ? review : r));
            return [review, ...prev];
        });
    };
    const handleReviewDeleted = (reviewId: number, stats: RatingStats) => {
        setRatingStats(stats);
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        if (userReview?.id === reviewId) setUserReview(null);
    };
    const handleReviewUpdated = (review: Review, stats: RatingStats) => {
        setRatingStats(stats);
        setReviews((prev) => prev.map((r) => (r.id === review.id ? review : r)));
        if (userReview?.id === review.id) setUserReview(review);
    };

    return (
        <>
            <Head title={course.title} />

            <div className="min-h-screen bg-[#FAFAF8] pt-24 pb-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-8">
                    <Link
                        href="/course"
                        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-purple-700"
                    >
                        <ArrowLeft size={17} />
                        Back to courses
                    </Link>

                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Main content */}
                        <section className="space-y-7 lg:col-span-2">
                            <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
                                <img src={course.thumbnail_url} alt={course.title} className="aspect-video w-full object-cover" />
                            </div>

                            <div className="space-y-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    {course.categories?.map((category) => (
                                        <Badge key={category.id} variant="purple">{category.name}</Badge>
                                    ))}
                                    {course.level && <Badge>{course.level}</Badge>}
                                </div>

                                <div>
                                    <p className="mb-2 text-sm font-medium text-purple-700">Course</p>
                                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{course.title}</h1>

                                    {ratingStats.total > 0 && (
                                        <div className="mt-3 flex items-center gap-2">
                                            <StarRating value={Math.round(ratingStats.average)} readonly size="sm" />
                                            <span className="text-sm font-semibold text-amber-600">{ratingStats.average.toFixed(1)}</span>
                                            <span className="text-sm text-slate-400">({ratingStats.total} reviews)</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-4 border-y border-slate-200 py-5 sm:grid-cols-3">
                                    <CourseInfo icon={<UserRound size={18} />} label="Instructor" value={course.creator?.name || '—'} />
                                    <CourseInfo icon={<Layers size={18} />} label="Level" value={course.level || 'All levels'} />
                                    <CourseInfo icon={<Clock3 size={18} />} label="Access" value="Learn at your pace" />
                                </div>

                                <div className="prose prose-slate max-w-none">
                                    <h3 className="text-base font-bold text-slate-900">About this course</h3>
                                    <p className="leading-relaxed whitespace-pre-line text-slate-600">
                                        {course.description || 'Course description is not available yet.'}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Sidebar — becomes resume when already enrolled */}
                        <aside className="h-fit border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
                            {isEnrolled ? (
                                <>
                                    <p className="inline-flex items-center gap-1.5 border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                        <CheckCircle2 size={14} /> Enrolled
                                    </p>
                                    <p className="mt-3 text-sm font-medium text-slate-500">Your progress</p>
                                    <p className="mt-1 text-2xl font-bold text-slate-900">{progressPercent}%</p>
                                    <div className="mt-2 h-2 overflow-hidden bg-slate-100">
                                        <div className="h-full bg-purple-500 transition-all" style={{ width: `${progressPercent}%` }} />
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500">
                                        {completedCount} of {totalMaterials} materials completed
                                    </p>

                                    <div className="my-5 border-t border-slate-100" />

                                    <Link href={`/student/courses/${course.slug}`} className="block">
                                        <Button widthFull leftIcon={<PlayCircle size={18} />}>
                                            {progressPercent === 100 ? 'Review Course' : completedCount > 0 ? 'Resume Learning' : 'Start Learning'}
                                        </Button>
                                    </Link>
                                    <Link href="/student/courses" className="mt-2 block text-center text-xs font-medium text-purple-700 hover:underline">
                                        Back to My Learning
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-medium text-slate-500">Course access</p>
                                    <p className="mt-1 text-2xl font-bold text-slate-900">
                                        {course.type === 'free' ? 'Free' : `Rp ${Number(course.price ?? 0).toLocaleString('id-ID')}`}
                                    </p>

                                    {ratingStats.total > 0 && (
                                        <div className="mt-2 flex items-center gap-1.5">
                                            <StarRating value={Math.round(ratingStats.average)} readonly size="sm" />
                                            <span className="text-xs text-slate-500">
                                                {ratingStats.average.toFixed(1)} ({ratingStats.total})
                                            </span>
                                        </div>
                                    )}

                                    <div className="my-5 border-t border-slate-100" />

                                    {user?.role === 'student' ? (
                                        <Button widthFull onClick={enroll} isLoading={processing} leftIcon={<BookOpen size={18} />}>
                                            {course.type === 'free' ? 'Enroll Now' : 'Buy Course'}
                                        </Button>
                                    ) : !user ? (
                                        <Link href="/login" className="block">
                                            <Button widthFull leftIcon={<BookOpen size={18} />}>Sign in to enroll</Button>
                                        </Link>
                                    ) : null}

                                    <div className="mt-5 space-y-3 text-sm text-slate-600">
                                        <p className="flex items-center gap-2">
                                            <CheckCircle2 size={17} className="text-emerald-600" /> Full course access after enrollment
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <CheckCircle2 size={17} className="text-emerald-600" /> Learn anytime, at your own pace
                                        </p>
                                    </div>
                                </>
                            )}
                        </aside>
                    </div>

                    {/* Discussion — bottom of the page */}
                    <section className="mt-8 border border-slate-200 bg-white p-6 shadow-sm">
                        <CommentThread
                            comments={comments}
                            courseSlug={course.slug}
                            currentUserId={isEnrolled ? user?.id : undefined}
                        />
                    </section>

                    {/* Ratings — bottom of the page, form only at 100%, list always visible */}
                    <section className="mt-8 border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="mb-5 flex items-center gap-2">
                            <Star size={18} className="text-purple-600" />
                            <h2 className="text-base font-bold text-slate-800">
                                Ratings {ratingStats.total > 0 && <span className="font-normal text-slate-400">({ratingStats.total})</span>}
                            </h2>
                        </div>

                        <div className="space-y-6">
                            {ratingStats.total > 0 && <RatingSummary stats={ratingStats} />}

                            <div className="border border-slate-200 bg-slate-50 p-5">
                                <h3 className="mb-4 text-sm font-bold text-slate-800">
                                    {userReview ? 'Your Review' : 'Write a Review'}
                                </h3>
                                {canReview ? (
                                    userReview ? (
                                        <ReviewCard
                                            review={userReview}
                                            courseSlug={course.slug}
                                            currentUserId={user?.id}
                                            onDeleted={handleReviewDeleted}
                                            onUpdated={handleReviewUpdated}
                                        />
                                    ) : (
                                        <ReviewForm courseSlug={course.slug} onSuccess={handleReviewSuccess} />
                                    )
                                ) : isEnrolled ? (
                                    <div className="flex items-start gap-3 border border-amber-200 bg-amber-50 p-4">
                                        <Lock size={16} className="mt-0.5 shrink-0 text-amber-600" />
                                        <div>
                                            <p className="text-sm font-semibold text-amber-900">Reviews unlock at 100% completion</p>
                                            <p className="mt-1 text-sm text-amber-700">
                                                Your progress is {progressPercent}% ({completedCount}/{totalMaterials} materials).
                                                Finish all materials to leave a rating. You can still read other students&apos; reviews below.
                                            </p>
                                        </div>
                                    </div>
                                ) : !user ? (
                                    <div className="border border-slate-100 bg-white p-4 text-center text-sm text-slate-500">
                                        <a href="/login" className="font-medium text-purple-600 hover:underline">Sign in</a> and enroll to leave a review after finishing 100% of the course.
                                    </div>
                                ) : (
                                    <div className="border border-slate-100 bg-white p-4 text-center text-sm text-slate-500">
                                        Enroll in this course to leave a review after finishing 100% of the course.
                                    </div>
                                )}
                            </div>

                            {reviews.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare size={15} className="text-slate-400" />
                                        <h3 className="text-sm font-bold text-slate-700">All Reviews ({reviews.length})</h3>
                                    </div>
                                    {reviews.map((review) => (
                                        <ReviewCard
                                            key={review.id}
                                            review={review}
                                            courseSlug={course.slug}
                                            currentUserId={user?.id}
                                            onDeleted={handleReviewDeleted}
                                            onUpdated={handleReviewUpdated}
                                        />
                                    ))}
                                </div>
                            )}

                            {reviews.length === 0 && (
                                <div className="py-6 text-center text-slate-400">
                                    <Star size={32} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No reviews yet. Be the first to share your experience!</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

function CourseInfo({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="text-purple-700">{icon}</div>
            <div>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-medium text-slate-700">{value}</p>
            </div>
        </div>
    );
}

CourseDetailPage.layout = (page: React.ReactNode) => <WelcomeLayout>{page}</WelcomeLayout>;
