import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, BookOpen, CheckCircle2, Clock3, Layers, Lock, MessageSquare, PlayCircle, Star, UserRound } from 'lucide-react';
import { useState } from 'react';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import CommentThread from '@/components/molecules/CommentThread';
import RatingSummary from '@/components/molecules/RatingSummary';
import RefundPolicyNotice from '@/components/molecules/RefundPolicyNotice';
import ReviewCard from '@/components/molecules/ReviewCard';
import ReviewForm from '@/components/molecules/ReviewForm';
import StarRating from '@/components/molecules/StarRating';
import CheckoutModal from '@/components/organisms/Payment/CheckoutModal';
import WelcomeLayout from '@/components/templates/WelcomeLayout';
import { formatCoursePrice } from '@/lib/currency';
import type { Course, Review, RatingStats, Comment, PaymentGateway, PaymentMethod, RefundPolicy } from '@/types';
import type { SharedPageProps } from '@/types/shared';

interface CourseDetailPageProps {
    course: Course;
    isEnrolled: boolean;
    canReview?: boolean;
    progressPercent?: number;
    completedCount?: number;
    totalContents?: number;
    refundPolicy?: RefundPolicy | null;
    reviews: Review[];
    ratingStats: RatingStats;
    userReview?: Review | null;
    comments: Comment[];
    paymentMethods?: PaymentMethod[];
    paymentGateway?: PaymentGateway | null;
}

export default function CourseDetailPage({
    course,
    isEnrolled,
    canReview = false,
    progressPercent = 0,
    completedCount = 0,
    totalContents = 0,
    refundPolicy = null,
    reviews: initialReviews,
    ratingStats: initialStats,
    userReview: initialUserReview,
    comments,
    paymentMethods = [],
    paymentGateway = null,
}: CourseDetailPageProps) {
    const { auth } = usePage<SharedPageProps>().props;
    const user = auth?.user;
    const [processing, setProcessing] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'discussion' | 'ratings'>('discussion');

    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [ratingStats, setRatingStats] = useState<RatingStats>(initialStats);
    const [userReview, setUserReview] = useState<Review | null>(initialUserReview ?? null);

    const enroll = () => {
        if (course.type === 'paid') {
            setCheckoutOpen(true);

            return;
        }

        setProcessing(true);
        router.post(`/course/${course.slug}/enroll`, {}, { onFinish: () => setProcessing(false) });
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

            <div className="min-h-screen bg-gray-100 pt-24 pb-20 dark:bg-[#1e1f24]">
                <div className="mx-auto max-w-7xl px-4 sm:px-8">
                    <Link href="/course" className="mb-6 inline-block">
                        <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<ArrowLeft size={17} />}
                            className="!rounded-none !text-slate-500 hover:!text-purple-700 dark:!text-slate-400 dark:hover:!text-purple-400"
                        >
                            Back to courses
                        </Button>
                    </Link>

                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Main content */}
                        <section className="space-y-7 lg:col-span-2">
                            <div className="overflow-hidden border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1e1f24]">
                                <img src={course.thumbnail_url} alt={course.title} className="aspect-video w-full object-cover" />
                            </div>

                            <div className="space-y-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    {course.categories?.map((category) => (
                                        <Badge key={category.id} variant="purple">
                                            {category.name}
                                        </Badge>
                                    ))}
                                    {course.level && <Badge>{course.level}</Badge>}
                                </div>

                                <div>
                                    <p className="mb-2 text-sm font-medium text-purple-700 dark:text-purple-400">Course</p>
                                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{course.title}</h1>

                                    {ratingStats.total > 0 && (
                                        <div className="mt-3 flex items-center gap-2">
                                            <StarRating value={Math.round(ratingStats.average)} readonly size="sm" />
                                            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                                                {ratingStats.average.toFixed(1)}
                                            </span>
                                            <span className="text-sm text-slate-400 dark:text-slate-500">({ratingStats.total} reviews)</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-4 border-y border-slate-200 py-5 sm:grid-cols-3 dark:border-slate-700">
                                    <CourseInfo icon={<UserRound size={18} />} label="Instructor" value={course.creator?.name || '—'} />
                                    <CourseInfo icon={<Layers size={18} />} label="Level" value={course.level || 'All levels'} />
                                    <CourseInfo icon={<Clock3 size={18} />} label="Access" value="Learn at your pace" />
                                </div>

                                <div className="prose prose-slate dark:prose-invert max-w-none">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">About this course</h3>
                                    <p className="leading-relaxed whitespace-pre-line text-slate-600 dark:text-slate-300">
                                        {course.description || 'Course description is not available yet.'}
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Sidebar — becomes resume when already enrolled */}
                        <aside className="h-fit border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24 dark:border-slate-700 dark:bg-[#1e1f24]">
                            {isEnrolled ? (
                                <>
                                    <p className="inline-flex items-center gap-1.5 border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400">
                                        <CheckCircle2 size={14} /> Enrolled
                                    </p>
                                    <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">Your progress</p>
                                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{progressPercent}%</p>
                                    <div className="mt-2 h-2 overflow-hidden bg-slate-100 dark:bg-slate-700">
                                        <div className="h-full bg-purple-500 transition-all" style={{ width: `${progressPercent}%` }} />
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                        {completedCount} of {totalContents} lessons completed
                                    </p>

                                    <RefundPolicyNotice policy={refundPolicy} variant="compact" className="mt-3" />

                                    <div className="my-5 border-t border-slate-100 dark:border-slate-700" />

                                    <Link href={`/student/courses/${course.slug}`} className="block">
                                        <Button widthFull leftIcon={<PlayCircle size={18} />}>
                                            {progressPercent === 100 ? 'Review Course' : completedCount > 0 ? 'Resume Learning' : 'Start Learning'}
                                        </Button>
                                    </Link>
                                    <Link href="/student/courses" className="mt-2 block text-center">
                                        <Button variant="ghost" size="sm" className="!rounded-none !text-purple-700 dark:!text-purple-400">
                                            Back to My Learning
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Course access</p>
                                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                                        {formatCoursePrice(course.type, course.price)}
                                    </p>

                                    {ratingStats.total > 0 && (
                                        <div className="mt-2 flex items-center gap-1.5">
                                            <StarRating value={Math.round(ratingStats.average)} readonly size="sm" />
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {ratingStats.average.toFixed(1)} ({ratingStats.total})
                                            </span>
                                        </div>
                                    )}

                                    <div className="my-5 border-t border-slate-100 dark:border-slate-700" />

                                    {user?.role === 'student' ? (
                                        <Button widthFull onClick={enroll} isLoading={processing} leftIcon={<BookOpen size={18} />}>
                                            {course.type === 'free' ? 'Enroll Now' : 'Buy Course'}
                                        </Button>
                                    ) : !user ? (
                                        <Link href="/login" className="block">
                                            <Button widthFull leftIcon={<BookOpen size={18} />}>
                                                Sign in to enroll
                                            </Button>
                                        </Link>
                                    ) : null}

                                    <div className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                                        <p className="flex items-center gap-2">
                                            <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-400" /> Full course access after
                                            enrollment
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-400" /> Learn anytime, at your own
                                            pace
                                        </p>
                                    </div>
                                </>
                            )}
                        </aside>
                    </div>

                    {/* Discussion & Ratings — tabbed */}
                    <section className="mt-8 border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1e1f24]">
                        {/* Tab bar */}
                        <div className="flex border-b border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setActiveTab('discussion')}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors ${
                                    activeTab === 'discussion'
                                        ? 'border-b-2 border-purple-600 text-purple-700 dark:text-purple-400'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                <MessageSquare size={16} />
                                Discussion
                                {comments.length > 0 && (
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                            activeTab === 'discussion'
                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                        }`}
                                    >
                                        {comments.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('ratings')}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors ${
                                    activeTab === 'ratings'
                                        ? 'border-b-2 border-purple-600 text-purple-700 dark:text-purple-400'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                <Star size={16} />
                                Ratings
                                {ratingStats.total > 0 && (
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                            activeTab === 'ratings'
                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                        }`}
                                    >
                                        {ratingStats.total}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Tab content */}
                        <div className="p-6">
                            {activeTab === 'discussion' && (
                                <CommentThread comments={comments} courseSlug={course.slug} currentUserId={isEnrolled ? user?.id : undefined} />
                            )}

                            {activeTab === 'ratings' && (
                                <div className="space-y-6">
                                    {ratingStats.total > 0 && <RatingSummary stats={ratingStats} />}

                                    <div className="border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-[#1e1f24]">
                                        <h3 className="mb-4 text-sm font-bold text-slate-800 dark:text-slate-100">
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
                                            <div className="flex items-start gap-3 border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
                                                <Lock size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                                <div>
                                                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                                                        Reviews unlock at 100% completion
                                                    </p>
                                                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                                                        Your progress is {progressPercent}% ({completedCount}/{totalContents} lessons). Finish all
                                                        lessons to leave a rating. You can still read other students&apos; reviews below.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : !user ? (
                                            <div className="border border-slate-100 bg-white p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-400">
                                                <a href="/login" className="font-medium text-purple-600 hover:underline dark:text-purple-400">
                                                    Sign in
                                                </a>{' '}
                                                and enroll to leave a review after finishing 100% of the course.
                                            </div>
                                        ) : (
                                            <div className="border border-slate-100 bg-white p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-400">
                                                Enroll in this course to leave a review after finishing 100% of the course.
                                            </div>
                                        )}
                                    </div>

                                    {reviews.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <MessageSquare size={15} className="text-slate-400 dark:text-slate-500" />
                                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                    All Reviews ({reviews.length})
                                                </h3>
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
                                        <div className="py-6 text-center text-slate-400 dark:text-slate-500">
                                            <Star size={32} className="mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">No reviews yet. Be the first to share your experience!</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            <CheckoutModal
                open={checkoutOpen}
                onClose={() => setCheckoutOpen(false)}
                course={course}
                paymentMethods={paymentMethods}
                gateway={paymentGateway}
            />
        </>
    );
}

function CourseInfo({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="text-purple-700 dark:text-purple-400">{icon}</div>
            <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{value}</p>
            </div>
        </div>
    );
}

CourseDetailPage.layout = (page: React.ReactNode) => <WelcomeLayout>{page}</WelcomeLayout>;
