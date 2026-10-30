import { Head, Link, router } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Circle,
    Clock3,
    Download,
    FileText,
    GraduationCap,
    Moon,
    PanelLeftClose,
    PanelLeftOpen,
    PlayCircle,
    Sun,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import Badge from '@/components/atoms/Badge';
import PreviewFileViewer from '@/components/molecules/course-preview/PreviewFileViewer';
import PreviewPptViewer from '@/components/molecules/course-preview/PreviewPptViewer';
import PreviewTextViewer from '@/components/molecules/course-preview/PreviewTextViewer';
import PreviewVideoViewer from '@/components/molecules/course-preview/PreviewVideoViewer';
import CourseQuizRunner, { type QuizQuestion, type QuizState } from '@/components/organisms/Course/CourseQuizRunner';
import { useInertiaToast } from '@/hooks/useInertiaToast';
import { useTheme } from '@/hooks/useTheme';
import type { Course, Material, MaterialContent, Module } from '@/types';

type LessonContent = MaterialContent & {
    quiz_questions?: QuizQuestion[];
};

type Lesson = {
    content: LessonContent;
    material: Material;
    module: Module;
};

interface LearningPageProps {
    course: Course;
    progress: Record<number, boolean>;
    contentProgress?: Record<number, boolean>;
    quizStates?: Record<number, QuizState>;
    certificate?: { id: number; certificate_number: string } | null;
    currentMaterial?: Material | null;
    currentContent?: LessonContent | null;
    resume?: { material_id: number; content_id?: number | null } | null;
}

function getCsrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

function requirementHint(content: LessonContent): string {
    switch (content.type) {
        case 'video':
            return 'play the video';
        case 'quiz':
            return 'answer all questions and submit';
        case 'text':
            return 'read this lesson to the bottom';
        case 'file':
        case 'ppt':
            return 'open the file';
        default:
            return 'open this lesson';
    }
}

export default function LearningPage({
    course,
    progress,
    contentProgress,
    quizStates,
    certificate,
    currentContent,
    resume,
}: LearningPageProps) {
    useInertiaToast();
    const { toggle: toggleTheme, isDark } = useTheme();

    const lessons = useMemo<Lesson[]>(
        () =>
            (course.modules ?? []).flatMap((mod) =>
                (mod.materials ?? []).flatMap((mat) =>
                    (mat.contents ?? []).map((con) => ({ content: con, material: mat, module: mod })),
                ),
            ),
        [course],
    );

    const [selectedContentId, setSelectedContentId] = useState<number | null>(
        currentContent?.id ?? resume?.content_id ?? lessons[0]?.content.id ?? null,
    );
    const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>(() =>
        Object.fromEntries((course.modules ?? []).map((m) => [m.id, true])),
    );
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [contentProgressState, setContentProgressState] = useState<Record<number, boolean>>(
        contentProgress ?? {},
    );
    const [quizStatesState, setQuizStatesState] = useState<Record<number, QuizState>>(quizStates ?? {});
    const scrollRef = useRef<HTMLDivElement>(null);
    const completingContentRef = useRef<Set<number>>(new Set());
    const pendingCompletionsRef = useRef<Map<number, Promise<unknown>>>(new Map());
    const autoCompletedMaterialsRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        setContentProgressState(contentProgress ?? {});
    }, [contentProgress]);

    useEffect(() => {
        setQuizStatesState(quizStates ?? {});
    }, [quizStates]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [selectedContentId]);

    const activeIndex = lessons.findIndex((l) => l.content.id === selectedContentId);
    const activeLesson = lessons[activeIndex] ?? lessons[0];
    const isVideo = activeLesson?.content.type === 'video';

    const materials = (course.modules ?? []).flatMap((m) => m.materials ?? []);
    const completedCount = materials.filter((m) => progress[m.id]).length;
    const progressPercent = materials.length ? Math.round((completedCount / materials.length) * 100) : 0;

    // The progress bars follow lesson-level completion so they move as soon as
    // a video is played, a file is opened, a text is read, or a quiz is submitted.
    const totalContents = lessons.length;
    const completedContents = lessons.filter((lesson) =>
        Boolean(contentProgressState[lesson.content.id]),
    ).length;
    const contentPercent = totalContents
        ? Math.round((completedContents / totalContents) * 100)
        : 0;
    const isCompleted = Boolean(activeLesson && progress[activeLesson.material.id]);

    const materialContents = activeLesson?.material.contents ?? [];
    const allContentsDone =
        materialContents.length > 0 &&
        materialContents.every((content) => Boolean(contentProgressState[content.id]));

    const selectContent = (contentId: number) => setSelectedContentId(contentId);
    const selectMaterial = (material: Material) => {
        const first = material.contents?.[0];
        if (first) setSelectedContentId(first.id);
    };

    const completeMaterialWhenReady = async (
        contentId: number,
        progressMap: Record<number, boolean>,
        pendingPromise?: Promise<unknown>,
    ) => {
        const lesson = lessons.find((item) => item.content.id === contentId);

        if (!lesson) {
            return;
        }

        const materialId = lesson.material.id;
        const materialContents = lessons
            .filter((item) => item.material.id === materialId)
            .map((item) => item.content);
        const allContentsDone =
            materialContents.length > 0 &&
            materialContents.every((content) => Boolean(progressMap[content.id]));

        if (!allContentsDone || progress[materialId] || autoCompletedMaterialsRef.current.has(materialId)) {
            return;
        }

        autoCompletedMaterialsRef.current.add(materialId);

        if (pendingPromise) {
            await Promise.allSettled([pendingPromise]);
        }

        router.post(
            `/student/courses/${course.slug}/progress`,
            { material_id: materialId },
            {
                preserveScroll: true,
                onFinish: () => autoCompletedMaterialsRef.current.delete(materialId),
            },
        );
    };

    const completeContent = (contentId: number, skipServer = false) => {
        if (!contentId || contentProgressState[contentId] || completingContentRef.current.has(contentId)) {
            return;
        }

        completingContentRef.current.add(contentId);
        const nextProgress = { ...contentProgressState, [contentId]: true };
        setContentProgressState(nextProgress);

        if (skipServer) {
            completingContentRef.current.delete(contentId);
            void completeMaterialWhenReady(contentId, nextProgress);
            return;
        }

        const request = fetch(`/student/courses/${course.slug}/contents/${contentId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
            },
        })
            .catch(() => {
                setContentProgressState((prev) => {
                    const next = { ...prev };
                    delete next[contentId];
                    return next;
                });
            })
            .finally(() => {
                completingContentRef.current.delete(contentId);
                pendingCompletionsRef.current.delete(contentId);
            });

        pendingCompletionsRef.current.set(contentId, request);
        void completeMaterialWhenReady(contentId, nextProgress, request).then(() => undefined, () => undefined);
    };

    const maybeCompleteText = () => {
        if (!activeLesson || activeLesson.content.type !== 'text') return;

        const element = scrollRef.current;
        if (!element) return;

        const reachedBottom =
            element.scrollHeight - element.scrollTop - element.clientHeight <= 48;

        if (reachedBottom) {
            completeContent(activeLesson.content.id);
        }
    };

    useEffect(() => {
        if (activeLesson?.content.type !== 'text') return;

        const timer = window.setTimeout(maybeCompleteText, 300);

        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedContentId, activeLesson?.content.type]);

    return (
        <>
            <Head title={`${course.title} — Learning`} />

            {/* Focused course bar: replaces the normal user navbar while learning. */}
            <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-[#1e1f24]">
                <button
                    type="button"
                    onClick={() => router.visit('/student/courses')}
                    title="Quit course and return to My Learning"
                    aria-label="Quit course and return to My Learning"
                    className="flex h-8 w-8 shrink-0 items-center justify-center border border-slate-200 text-slate-500 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-rose-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                >
                    <X size={17} />
                </button>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {course.title}
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700 sm:w-32">
                        <div
                            className="h-full rounded-full bg-purple-500 transition-all"
                            style={{ width: `${contentPercent}%` }}
                        />
                    </div>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                        {contentPercent}%
                    </span>
                    <span className="hidden text-xs text-slate-400 dark:text-slate-500 sm:inline">
                        {completedContents}/{totalContents} done
                    </span>
                    <button
                        type="button"
                        onClick={toggleTheme}
                        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        className="flex h-8 w-8 shrink-0 items-center justify-center border border-slate-200 text-slate-500 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-purple-600 dark:hover:bg-purple-950/40 dark:hover:text-purple-400"
                    >
                        {isDark ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>
            </header>

            {/* Content + Sidebar — fills the remaining viewport height. */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left: scrollable content */}
                <div
                    ref={scrollRef}
                    onScroll={maybeCompleteText}
                    className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-slate-50 dark:bg-[#1e1f24]"
                >
                    {/* Certificate banner */}
                    {progressPercent === 100 && (
                        <div className="flex flex-col gap-4 border-b border-amber-200 bg-amber-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/50 dark:bg-amber-950/30">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60">
                                    <Award size={18} className="text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
                                        Course completed!
                                    </p>
                                    <p className="text-xs text-amber-700 dark:text-amber-400">
                                        Your certificate is ready to download.
                                    </p>
                                </div>
                            </div>
                            <div className="flex shrink-0 gap-2">
                                {certificate && (
                                    <a
                                        href={`/student/certificates/${certificate.id}/download`}
                                        className="flex items-center gap-1.5 bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-400"
                                        download
                                    >
                                        <Download size={13} /> Download Certificate
                                    </a>
                                )}
                                <Link
                                    href="/student/certificates"
                                    className="flex items-center gap-1.5 border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-50 dark:border-amber-800 dark:bg-[#1e1f24] dark:text-amber-300 dark:hover:bg-amber-950/30"
                                >
                                    View All
                                </Link>
                            </div>
                        </div>
                    )}

                    {!activeLesson ? (
                        <div className="flex flex-1 flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                            <GraduationCap className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                            <p className="text-sm">No lesson available yet.</p>
                        </div>
                    ) : (
                        <div className="mx-auto w-full max-w-7xl space-y-5 p-6 sm:p-8">
                            {/* Lesson header */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="mb-1 text-[11px] font-semibold tracking-widest text-purple-500 uppercase dark:text-purple-400">
                                        {activeLesson.module.title}
                                    </p>
                                    <h1 className="text-xl leading-snug font-bold text-slate-900 dark:text-white sm:text-2xl">
                                        {activeLesson.content.title}
                                    </h1>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <Badge variant="purple">{activeLesson.content.type}</Badge>
                                        {activeLesson.material.title !== activeLesson.content.title && (
                                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                                {activeLesson.material.title}
                                            </span>
                                        )}
                                        {activeLesson.content.duration && (
                                            <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                                                <Clock3 size={12} /> {activeLesson.content.duration}m
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Prev / Next */}
                                <div className="flex shrink-0 items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={activeIndex <= 0}
                                        onClick={() =>
                                            activeIndex > 0 && setSelectedContentId(lessons[activeIndex - 1].content.id)
                                        }
                                        className="flex items-center gap-1 border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-300 dark:hover:border-purple-600 dark:hover:bg-purple-950/40 dark:hover:text-purple-400"
                                    >
                                        <ChevronLeft size={14} /> Prev
                                    </button>
                                    <button
                                        type="button"
                                        disabled={activeIndex >= lessons.length - 1}
                                        onClick={() =>
                                            activeIndex < lessons.length - 1 &&
                                            setSelectedContentId(lessons[activeIndex + 1].content.id)
                                        }
                                        className="flex items-center gap-1 border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-300 dark:hover:border-purple-600 dark:hover:bg-purple-950/40 dark:hover:text-purple-400"
                                    >
                                        Next <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Content viewer */}
                            <div
                                className={`overflow-hidden border border-slate-200 shadow-xs dark:border-slate-700 ${
                                    isVideo ? 'bg-[#141416]' : 'bg-white dark:bg-[#1e1f24]'
                                }`}
                            >
                                <LessonViewer
                                    lesson={activeLesson}
                                    courseSlug={course.slug}
                                    quizState={quizStatesState?.[activeLesson.content.id]}
                                    onQuizStateChange={(state) =>
                                        setQuizStatesState((prev) => ({
                                            ...prev,
                                            [activeLesson.content.id]: state,
                                        }))
                                    }
                                    onVideoCompleted={() => completeContent(activeLesson.content.id)}
                                    onOpenAttachment={() => completeContent(activeLesson.content.id)}
                                    onQuizCompleted={() => completeContent(activeLesson.content.id, true)}
                                />
                            </div>

                            {/* Mark complete bar */}
                            <div className="space-y-3 border border-slate-200 bg-white px-5 py-4 shadow-xs dark:border-slate-700 dark:bg-[#1e1f24]">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        {isCompleted ? (
                                            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle2 size={16} /> Material completed
                                            </p>
                                        ) : allContentsDone ? (
                                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                                All lessons in this material are finished. This material will be marked as complete automatically.
                                            </p>
                                        ) : (
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Finish every lesson in this material before it can be marked as complete.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {!isCompleted && (
                                    <div className="space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-700">
                                        {materialContents.map((content) => {
                                            const done = Boolean(contentProgressState[content.id]);

                                            return (
                                                <div key={content.id} className="flex items-start gap-2 text-[11px]">
                                                    {done ? (
                                                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                                    ) : (
                                                        <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                                                    )}
                                                    <span
                                                        className={
                                                            done
                                                                ? 'font-medium text-emerald-600 dark:text-emerald-400'
                                                                : 'text-slate-500 dark:text-slate-400'
                                                        }
                                                    >
                                                        {content.title}
                                                        {!done && (
                                                            <span className="text-slate-400 dark:text-slate-500">
                                                                {' '}
                                                                — {requirementHint(content)}
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <p className="pb-4 text-center text-xs text-slate-400 dark:text-slate-500">
                                Discussion & reviews on the{' '}
                                <Link
                                    href={`/course/${course.slug}`}
                                    className="font-medium text-purple-600 hover:underline dark:text-purple-400"
                                >
                                    course page
                                </Link>
                            </p>
                        </div>
                    )}
                </div>

                {/* Right: sidebar */}
                {sidebarOpen ? (
                    <aside className="hidden w-80 shrink-0 flex-col border-l border-slate-200 bg-white lg:flex xl:w-80 dark:border-slate-700 dark:bg-[#1e1f24]">
                        {/* Sidebar header */}
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <BookOpen size={14} className="text-purple-600" />
                                <span className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-200">
                                    Course Content
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSidebarOpen(false)}
                                title="Hide sidebar"
                                className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-white"
                            >
                                <PanelLeftClose size={15} />
                            </button>
                        </div>

                        {/* Progress */}
                        <div className="shrink-0 border-b border-slate-100 px-4 py-3 dark:border-slate-700">
                            <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                <span>Progress</span>
                                <span className="font-bold text-purple-600 dark:text-purple-400">
                                    {contentPercent}%
                                </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                <div
                                    className="h-full rounded-full bg-purple-500 transition-all"
                                    style={{ width: `${contentPercent}%` }}
                                />
                            </div>
                            <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                                {completedContents} of {totalContents} done
                            </p>
                        </div>

                        {/* Module list — takes all remaining height and scrolls */}
                        <div className="flex-1 overflow-y-auto">
                            {(course.modules ?? []).map((mod, modIdx) => {
                                const expanded = expandedModules[mod.id] ?? true;

                                return (
                                    <div
                                        key={mod.id}
                                        className="border-b border-slate-100 last:border-b-0 dark:border-slate-700"
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setExpandedModules((v) => ({ ...v, [mod.id]: !expanded }))
                                            }
                                            className="flex w-full items-center justify-between gap-2 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100 dark:bg-[#1e1f24] dark:hover:bg-slate-700"
                                        >
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                                <span className="mr-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                                    {String(modIdx + 1).padStart(2, '0')}
                                                </span>
                                                {mod.title}
                                            </span>
                                            <ChevronDown
                                                size={13}
                                                className={`shrink-0 text-slate-400 transition-transform dark:text-slate-500 ${
                                                    expanded ? 'rotate-180' : ''
                                                }`}
                                            />
                                        </button>

                                        {expanded && (
                                            <div className="py-1">
                                                {(mod.materials ?? []).map((mat) => {
                                                    const done = Boolean(progress[mat.id]);
                                                    const activeMat = activeLesson?.material.id === mat.id;

                                                    return (
                                                        <div key={mat.id}>
                                                            <button
                                                                type="button"
                                                                onClick={() => selectMaterial(mat)}
                                                                className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold transition-colors ${
                                                                    activeMat
                                                                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
                                                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                                                                }`}
                                                            >
                                                                {done ? (
                                                                    <CheckCircle2
                                                                        size={13}
                                                                        className="shrink-0 text-emerald-500"
                                                                    />
                                                                ) : (
                                                                    <Circle
                                                                        size={13}
                                                                        className="shrink-0 text-slate-300 dark:text-slate-600"
                                                                    />
                                                                )}
                                                                <span className="truncate">{mat.title}</span>
                                                            </button>

                                                            {(mat.contents ?? []).length > 1 && (
                                                                <div className="pr-4 pl-10">
                                                                    {(mat.contents ?? []).map((con) => {
                                                                        const activeCon =
                                                                            activeLesson?.content.id === con.id;
                                                                        const contentDone = Boolean(
                                                                            contentProgressState[con.id],
                                                                        );

                                                                        return (
                                                                            <button
                                                                                key={con.id}
                                                                                type="button"
                                                                                onClick={() => selectContent(con.id)}
                                                                                className={`flex w-full items-center gap-1.5 py-1.5 text-left text-[11px] transition-colors ${
                                                                                    activeCon
                                                                                        ? 'font-semibold text-purple-600 dark:text-purple-400'
                                                                                        : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200'
                                                                                }`}
                                                                            >
                                                                                {contentDone ? (
                                                                                    <CheckCircle2
                                                                                        size={11}
                                                                                        className="shrink-0 text-emerald-500"
                                                                                    />
                                                                                ) : con.type === 'video' ? (
                                                                                    <PlayCircle
                                                                                        size={11}
                                                                                        className="shrink-0"
                                                                                    />
                                                                                ) : (
                                                                                    <FileText
                                                                                        size={11}
                                                                                        className="shrink-0"
                                                                                    />
                                                                                )}
                                                                                <span className="truncate">
                                                                                    {con.title}
                                                                                </span>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </aside>
                ) : (
                    /* Floating pill */
                    <div className="pointer-events-none fixed top-1/2 right-0 z-50 hidden -translate-y-1/2 lg:block">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            title="Show course content"
                            className="group pointer-events-auto flex items-center gap-2 rounded-l-full border border-r-0 border-slate-200 bg-white py-3 pr-3 pl-4 text-slate-500 shadow-lg transition-all duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-400 dark:hover:border-purple-600 dark:hover:bg-purple-950/40 dark:hover:text-purple-400"
                        >
                            <span className="max-w-0 overflow-hidden text-xs font-semibold whitespace-nowrap transition-all duration-200 group-hover:max-w-[5rem] group-hover:pr-1">
                                Contents
                            </span>
                            <PanelLeftOpen size={15} className="shrink-0" />
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

function LessonViewer({
    lesson,
    courseSlug,
    quizState,
    onQuizStateChange,
    onVideoCompleted,
    onOpenAttachment,
    onQuizCompleted,
}: {
    lesson: Lesson;
    courseSlug?: string;
    quizState?: QuizState;
    onQuizStateChange: (state: QuizState) => void;
    onVideoCompleted: () => void;
    onOpenAttachment: () => void;
    onQuizCompleted: () => void;
}) {
    const { content } = lesson;

    if (content.type === 'video') {
        return (
            <PreviewVideoViewer
                title={content.title}
                contentUrl={content.content_url}
                onCompleted={onVideoCompleted}
            />
        );
    }

    if (content.type === 'text') {
        return (
            <div className="p-6 sm:p-8">
                <PreviewTextViewer contentText={content.content_text} />
            </div>
        );
    }

    if (content.type === 'file') {
        return (
            <PreviewFileViewer
                title={content.title}
                contentUrl={content.content_url}
                onOpen={onOpenAttachment}
            />
        );
    }

    if (content.type === 'ppt') {
        return (
            <PreviewPptViewer
                title={content.title}
                contentUrl={content.content_url}
                onOpen={onOpenAttachment}
            />
        );
    }

    if (content.type === 'quiz') {
        return (
            <div className="p-6">
                <CourseQuizRunner
                    title={content.title}
                    duration={content.duration}
                    quizQuestions={content.quiz_questions}
                    courseSlug={courseSlug}
                    contentId={content.id}
                    initialState={quizState}
                    onStateChange={onQuizStateChange}
                    onContentCompleted={onQuizCompleted}
                />
            </div>
        );
    }

    return (
        <div className="p-10 text-center text-sm text-slate-400 dark:text-slate-500">
            This lesson format is not supported.
        </div>
    );
}

LearningPage.layout = (page: React.ReactNode) => (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 dark:bg-[#1e1f24]">
        {page}
        <ToastContainer
            position="top-right"
            autoClose={4000}
            newestOnTop
            pauseOnHover
            closeOnClick
        />
    </div>
);
