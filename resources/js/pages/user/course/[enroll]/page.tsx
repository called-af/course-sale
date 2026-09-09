import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ArrowLeft, Award, BookOpen, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Circle, Clock3, FileText, GraduationCap, MessageSquare, Star } from 'lucide-react';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import UserLayout from '@/components/templates/UserLayout';
import PreviewFileViewer from '@/components/molecules/CoursePreview/PreviewFileViewer';
import PreviewPptViewer from '@/components/molecules/CoursePreview/PreviewPptViewer';
import PreviewTextViewer from '@/components/molecules/CoursePreview/PreviewTextViewer';
import PreviewVideoViewer from '@/components/molecules/CoursePreview/PreviewVideoViewer';
import CourseQuizRunner from '@/components/organism/Course/CourseQuizRunner';
import CommentThread from '@/components/molecules/CommentThread';
import ReviewForm from '@/components/molecules/ReviewForm';
import ReviewCard from '@/components/molecules/ReviewCard';
import RatingSummary from '@/components/molecules/RatingSummary';
import { Course, Review, RatingStats, Comment } from '@/types';
import { usePage } from '@inertiajs/react';

type Lesson = {
    content: any;
    material: any;
    module: any;
};

interface LearningPageProps {
    course: Course;
    progress: Record<number, boolean>;
    certificate?: {
        id: number;
        certificate_number: string;
    } | null;
    comments: Comment[];
    reviews: Review[];
    ratingStats: RatingStats;
    userReview?: Review | null;
}

export default function LearningPage({ course, progress, certificate, comments, reviews: initialReviews, ratingStats: initialStats, userReview: initialUserReview }: LearningPageProps) {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const lessons = useMemo<Lesson[]>(
        () =>
            (course.modules ?? []).flatMap((module) =>
                (module.materials ?? []).flatMap((material) => (material.contents ?? []).map((content) => ({ content, material, module }))),
            ),
        [course],
    );
    const [selectedContentId, setSelectedContentId] = useState<number | null>(lessons[0]?.content.id ?? null);
    const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>(() =>
        Object.fromEntries((course.modules ?? []).map((module) => [module.id, true])),
    );
    const [markingComplete, setMarkingComplete] = useState(false);
    const [bottomTab, setBottomTab] = useState<'discussion' | 'reviews'>('discussion');

    // Reactive review state
    const [reviews, setReviews] = useState<Review[]>(initialReviews)
    const [ratingStats, setRatingStats] = useState<RatingStats>(initialStats)
    const [userReview, setUserReview] = useState<Review | null>(initialUserReview ?? null)

    const handleReviewSuccess = (review: Review, stats: RatingStats) => {
        setRatingStats(stats)
        setUserReview(review)
        setReviews((prev) => {
            const exists = prev.find((r) => r.id === review.id)
            if (exists) return prev.map((r) => r.id === review.id ? review : r)
            return [review, ...prev]
        })
    }
    const handleReviewDeleted = (reviewId: number, stats: RatingStats) => {
        setRatingStats(stats)
        setReviews((prev) => prev.filter((r) => r.id !== reviewId))
        if (userReview?.id === reviewId) setUserReview(null)
    }
    const handleReviewUpdated = (review: Review, stats: RatingStats) => {
        setRatingStats(stats)
        setReviews((prev) => prev.map((r) => r.id === review.id ? review : r))
        if (userReview?.id === review.id) setUserReview(review)
    }

    const activeIndex = lessons.findIndex((lesson) => lesson.content.id === selectedContentId);
    const activeLesson = lessons[activeIndex] ?? lessons[0];
    const materials = (course.modules ?? []).flatMap((module) => module.materials ?? []);
    const completedCount = materials.filter((material) => progress[material.id]).length;
    const progressPercent = materials.length ? Math.round((completedCount / materials.length) * 100) : 0;

    const selectMaterial = (material: any) => {
        const firstContent = material.contents?.[0];
        if (firstContent) setSelectedContentId(firstContent.id);
    };

    const markComplete = () => {
        if (!activeLesson || progress[activeLesson.material.id]) return;

        setMarkingComplete(true);
        router.post(
            `/student/courses/${course.slug}/progress`,
            { material_id: activeLesson.material.id },
            {
                preserveScroll: true,
                onFinish: () => setMarkingComplete(false),
            },
        );
    };

    return (
        <>
            <Head title={`Learn: ${course.title}`} />

            <div className="max-w-8xl mx-auto space-y-6">
                <header className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
                    <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
                    <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                        <div>
                            <Link
                                href="/student/courses"
                                className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white"
                            >
                                <ArrowLeft size={15} /> My Learning
                            </Link>
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{course.title}</h1>
                            <p className="mt-1 text-sm text-slate-300">Continue where you left off.</p>
                        </div>
                        <div className="min-w-48 bg-white/10 px-4 py-3 backdrop-blur-sm">
                            <div className="flex items-center justify-between text-xs text-slate-200">
                                <span>Your progress</span>
                                <span className="font-bold text-white">{progressPercent}%</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden bg-white/20">
                                <div className="h-full bg-purple-400 transition-all" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <p className="mt-2 text-[11px] text-slate-300">
                                {completedCount} of {materials.length} materials completed
                            </p>
                        </div>
                    </div>
                </header>

                {/* Congratulations banner — shown when 100% complete */}
                {progressPercent === 100 && (
                    <div className="flex flex-col gap-4 border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-amber-100">
                                <Award size={20} className="text-amber-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-amber-900">🎉 Congratulations! You've completed this course!</p>
                                <p className="mt-0.5 text-sm text-amber-700">
                                    Your certificate of completion has been generated and is ready to download.
                                </p>
                            </div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                            {certificate && (
                                <a
                                    href={`/student/certificates/${certificate.id}/download`}
                                    className="flex items-center gap-1.5 border border-amber-400 bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-300 transition-colors"
                                    download
                                >
                                    <Award size={15} />
                                    Download Certificate
                                </a>
                            )}
                            <Link
                                href="/student/certificates"
                                className="flex items-center gap-1.5 border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 transition-colors"
                            >
                                View All Certificates
                            </Link>
                        </div>
                    </div>
                )}

                <div className="grid items-start gap-6 lg:grid-cols-12">
                    <aside className="space-y-4 lg:sticky lg:top-20 lg:col-span-4">
                        <div className="border border-slate-200 bg-white p-4 shadow-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-purple-600" />
                                    <h2 className="text-sm font-bold tracking-wider text-slate-800 uppercase">Course Content</h2>
                                </div>
                                <span className="text-sm font-semibold text-slate-500">{lessons.length} lessons</span>
                            </div>

                            <div className="mt-4 space-y-3">
                                {(course.modules ?? []).map((module, moduleIndex) => {
                                    const expanded = expandedModules[module.id] ?? true;
                                    return (
                                        <div key={module.id}>
                                            <button
                                                type="button"
                                                onClick={() => setExpandedModules((value) => ({ ...value, [module.id]: !expanded }))}
                                                className="flex w-full items-center justify-between gap-2 px-2 py-2.5 text-left text-sm font-bold text-slate-700 hover:text-purple-700"
                                            >
                                                <span className="truncate">
                                                    MOD {String(moduleIndex + 1).padStart(2, '0')}: {module.title}
                                                </span>
                                                <ChevronDown
                                                    size={15}
                                                    className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'}
                                                />
                                            </button>

                                            {expanded && (
                                                <div className="ml-2 space-y-2 border-l border-slate-200 pl-3">
                                                    {(module.materials ?? []).map((material) => {
                                                        const completed = Boolean(progress[material.id]);
                                                        const active = activeLesson?.material.id === material.id;
                                                        return (
                                                            <div key={material.id}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => selectMaterial(material)}
                                                                    className={`flex w-full items-center gap-2 px-2 py-2.5 text-left text-sm font-semibold transition-colors ${active ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                                                >
                                                                    {completed ? (
                                                                        <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                                                                    ) : (
                                                                        <Circle size={16} className="shrink-0 text-slate-300" />
                                                                    )}
                                                                    <span className="truncate">{material.title}</span>
                                                                </button>
                                                                <div className="space-y-0.5 pl-7">
                                                                    {(material.contents ?? []).map((content) => (
                                                                        <button
                                                                            key={content.id}
                                                                            type="button"
                                                                            onClick={() => setSelectedContentId(content.id)}
                                                                            className={`flex w-full items-center gap-2 px-2 py-2 text-left text-xs transition-colors ${activeLesson?.content.id === content.id ? 'font-semibold text-purple-700' : 'text-slate-400 hover:text-slate-700'}`}
                                                                        >
                                                                            <FileText size={13} className="shrink-0" />
                                                                            <span className="truncate">{content.title}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>

                    <main className="space-y-4 lg:col-span-8">
                        {!activeLesson ? (
                            <div className="border border-slate-200 bg-white p-10 text-center text-slate-500">
                                <GraduationCap className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                                No lesson is available yet.
                            </div>
                        ) : (
                            <div className="space-y-5 border border-slate-200 bg-white p-6 shadow-xs">
                                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-purple-600">
                                            {activeLesson.module.title} / {activeLesson.material.title}
                                        </p>
                                        <h2 className="mt-1 text-xl font-bold text-slate-900">{activeLesson.content.title}</h2>
                                        <div className="mt-2 flex items-center gap-2">
                                            <Badge variant="purple">{activeLesson.content.type}</Badge>
                                            {activeLesson.content.duration && (
                                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                                    <Clock3 size={13} /> {activeLesson.content.duration}m
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="md"
                                            onClick={() => activeIndex > 0 && setSelectedContentId(lessons[activeIndex - 1].content.id)}
                                            disabled={activeIndex <= 0}
                                            leftIcon={<ChevronLeft size={18} />}
                                        >
                                            Prev
                                        </Button>
                                        <Button
                                            size="md"
                                            onClick={() =>
                                                activeIndex < lessons.length - 1 && setSelectedContentId(lessons[activeIndex + 1].content.id)
                                            }
                                            disabled={activeIndex >= lessons.length - 1}
                                            rightIcon={<ChevronRight size={18} />}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>

                                <LessonViewer lesson={activeLesson} courseSlug={course.slug} />

                                <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-sm text-slate-500">Finish this material when you are ready.</p>
                                    <Button
                                        onClick={markComplete}
                                        isLoading={markingComplete}
                                        disabled={Boolean(progress[activeLesson.material.id])}
                                        leftIcon={<CheckCircle2 size={17} />}
                                    >
                                        {progress[activeLesson.material.id] ? 'Material Completed' : 'Mark as Complete'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </main>
                </div>

                {/* Discussion & Reviews tabs */}
                <div className="border border-slate-200 bg-white shadow-xs">
                    <div className="border-b border-slate-200">
                        <nav className="flex">
                            <button
                                type="button"
                                onClick={() => setBottomTab('discussion')}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-b-2 ${bottomTab === 'discussion' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                <MessageSquare size={15} />
                                Discussion {comments.length > 0 && <span className="text-xs font-normal text-slate-400">({comments.length})</span>}
                            </button>
                            <button
                                type="button"
                                onClick={() => setBottomTab('reviews')}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors border-b-2 ${bottomTab === 'reviews' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                <Star size={15} />
                                Reviews {ratingStats.total > 0 && <span className="text-xs font-normal text-slate-400">({ratingStats.total})</span>}
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {bottomTab === 'discussion' && (
                            <CommentThread
                                comments={comments}
                                courseSlug={course.slug}
                                currentUserId={user?.id}
                            />
                        )}

                        {bottomTab === 'reviews' && (
                            <div className="space-y-6">
                                {ratingStats.total > 0 && <RatingSummary stats={ratingStats} />}

                                <div className="border border-slate-200 bg-slate-50 p-5">
                                    <h3 className="mb-4 text-sm font-bold text-slate-800">
                                        {userReview ? 'Your Review' : 'Write a Review'}
                                    </h3>
                                    {userReview ? (
                                        <ReviewCard
                                            review={userReview}
                                            courseSlug={course.slug}
                                            currentUserId={user?.id}
                                            onDeleted={handleReviewDeleted}
                                            onUpdated={handleReviewUpdated}
                                        />
                                    ) : (
                                        <ReviewForm
                                            courseSlug={course.slug}
                                            onSuccess={handleReviewSuccess}
                                        />
                                    )}
                                </div>

                                {reviews.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold text-slate-700">All Reviews ({reviews.length})</h3>
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
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function LessonViewer({ lesson, courseSlug }: { lesson: Lesson; courseSlug?: string }) {
    const content = lesson.content;
    if (content.type === 'video') return <PreviewVideoViewer title={content.title} contentUrl={content.content_url} />;
    if (content.type === 'text') return <PreviewTextViewer contentText={content.content_text} />;
    if (content.type === 'file') return <PreviewFileViewer title={content.title} contentUrl={content.content_url} />;
    if (content.type === 'ppt') return <PreviewPptViewer title={content.title} contentUrl={content.content_url} />;
    if (content.type === 'quiz') return <CourseQuizRunner title={content.title} duration={content.duration} quizQuestions={content.quiz_questions} courseSlug={courseSlug} contentId={content.id} />;
    return <div className="p-8 text-center text-sm text-slate-500">This lesson format is not supported.</div>;
}

LearningPage.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>;
