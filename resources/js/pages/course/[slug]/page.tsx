import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, BookOpen, CheckCircle2, Clock3, GraduationCap, Layers, MessageSquare, Star, UserRound } from 'lucide-react';
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
    reviews: Review[];
    ratingStats: RatingStats;
    userReview?: Review | null;
    comments: Comment[];
}

export default function CourseDetailPage({
    course,
    isEnrolled,
    reviews,
    ratingStats,
    userReview,
    comments,
}: CourseDetailPageProps) {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const [processing, setProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'discussion'>('overview');

    const enroll = () => {
        setProcessing(true);
        router.post(
            `/course/${course.slug}/enroll`,
            {},
            { onFinish: () => setProcessing(false) },
        );
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

                                    {/* Rating summary inline */}
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
                            </div>

                            {/* Tab navigation */}
                            <div className="border-b border-slate-200">
                                <nav className="flex gap-0">
                                    {(['overview', 'reviews', 'discussion'] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            type="button"
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-5 py-3 text-sm font-semibold capitalize transition-colors border-b-2 ${
                                                activeTab === tab
                                                    ? 'border-purple-600 text-purple-700'
                                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            {tab === 'reviews' && (
                                                <span className="flex items-center gap-1.5">
                                                    <Star size={14} /> Reviews {ratingStats.total > 0 && `(${ratingStats.total})`}
                                                </span>
                                            )}
                                            {tab === 'discussion' && (
                                                <span className="flex items-center gap-1.5">
                                                    <MessageSquare size={14} /> Discussion {comments.length > 0 && `(${comments.length})`}
                                                </span>
                                            )}
                                            {tab === 'overview' && 'Overview'}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            {/* Tab content */}
                            {activeTab === 'overview' && (
                                <div className="prose prose-slate max-w-none">
                                    <p className="leading-relaxed whitespace-pre-line text-slate-600">
                                        {course.description || 'Course description is not available yet.'}
                                    </p>
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <ReviewSection
                                    courseSlug={course.slug}
                                    reviews={reviews}
                                    ratingStats={ratingStats}
                                    userReview={userReview ?? null}
                                    isEnrolled={isEnrolled}
                                    user={user}
                                />
                            )}

                            {activeTab === 'discussion' && (
                                <CommentThread
                                    comments={comments}
                                    courseSlug={course.slug}
                                    currentUserId={isEnrolled ? user?.id : undefined}
                                />
                            )}
                        </section>

                        {/* Sidebar */}
                        <aside className="h-fit border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
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

                            {isEnrolled ? (
                                <Link href={`/student/courses/${course.slug}`} className="block">
                                    <Button widthFull leftIcon={<GraduationCap size={18} />}>Continue Learning</Button>
                                </Link>
                            ) : user?.role === 'student' ? (
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
                        </aside>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Review Section                                                        */
/* ------------------------------------------------------------------ */

interface ReviewSectionProps {
    courseSlug: string;
    reviews: Review[];
    ratingStats: RatingStats;
    userReview: Review | null;
    isEnrolled: boolean;
    user: any;
}

function ReviewSection({ courseSlug, reviews: initialReviews, ratingStats: initialStats, userReview: initialUserReview, isEnrolled, user }: ReviewSectionProps) {
    const [reviews, setReviews] = useState<Review[]>(initialReviews)
    const [ratingStats, setRatingStats] = useState<RatingStats>(initialStats)
    const [userReview, setUserReview] = useState<Review | null>(initialUserReview ?? null)
    const [showForm, setShowForm] = useState(!initialUserReview)
    const [successMsg, setSuccessMsg] = useState('')

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg)
        setTimeout(() => setSuccessMsg(''), 3000)
    }

    const handleReviewSuccess = (review: Review, stats: RatingStats) => {
        setRatingStats(stats)
        setUserReview(review)
        setShowForm(false)
        // Update dalam daftar review
        setReviews((prev) => {
            const exists = prev.find((r) => r.id === review.id)
            if (exists) return prev.map((r) => r.id === review.id ? review : r)
            return [review, ...prev]
        })
        showSuccess('Your review has been submitted. Thank you!')
    }

    const handleReviewDeleted = (reviewId: number, stats: RatingStats) => {
        setRatingStats(stats)
        setReviews((prev) => prev.filter((r) => r.id !== reviewId))
        if (userReview?.id === reviewId) {
            setUserReview(null)
            setShowForm(true)
        }
        showSuccess('Your review has been removed.')
    }

    const handleReviewUpdated = (review: Review, stats: RatingStats) => {
        setRatingStats(stats)
        setReviews((prev) => prev.map((r) => r.id === review.id ? review : r))
        if (userReview?.id === review.id) setUserReview(review)
        showSuccess('Your review has been updated.')
    }

    return (
        <div className="space-y-6">
            {/* Success message */}
            {successMsg && (
                <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    ✓ {successMsg}
                </div>
            )}

            {/* Rating distribution */}
            {ratingStats.total > 0 && (
                <RatingSummary stats={ratingStats} />
            )}

            {/* Write / edit review */}
            {isEnrolled && (
                <div className="border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-800">
                            {userReview ? 'Your Review' : 'Write a Review'}
                        </h3>
                        {userReview && (
                            <button
                                type="button"
                                onClick={() => setShowForm((v) => !v)}
                                className="text-xs text-purple-600 hover:underline"
                            >
                                {showForm ? 'Cancel' : 'Edit review'}
                            </button>
                        )}
                    </div>

                    {userReview && !showForm ? (
                        <ReviewCard
                            review={userReview}
                            courseSlug={courseSlug}
                            currentUserId={user?.id}
                            onDeleted={handleReviewDeleted}
                            onUpdated={handleReviewUpdated}
                        />
                    ) : (
                        <ReviewForm
                            courseSlug={courseSlug}
                            existing={userReview}
                            onSuccess={handleReviewSuccess}
                            onCancel={userReview ? () => setShowForm(false) : undefined}
                        />
                    )}
                </div>
            )}

            {!isEnrolled && !user && (
                <div className="border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500 text-center">
                    <a href="/login" className="font-medium text-purple-600 hover:underline">Sign in</a> and enroll to leave a review.
                </div>
            )}

            {!isEnrolled && user?.role === 'student' && (
                <div className="border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500 text-center">
                    Enroll in this course to leave a review.
                </div>
            )}

            {/* All reviews list */}
            {reviews.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                    <Star size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No reviews yet. Be the first to share your experience!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-700">All Reviews ({reviews.length})</h3>
                    {reviews.map((review) => (
                        <ReviewCard
                            key={review.id}
                            review={review}
                            courseSlug={courseSlug}
                            currentUserId={user?.id}
                            onDeleted={handleReviewDeleted}
                            onUpdated={handleReviewUpdated}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

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
