import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
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
    PanelLeftClose,
    PanelLeftOpen,
    PlayCircle,
} from 'lucide-react';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import UserNavbar from '@/components/organisms/user/UserNavbar';
import PreviewFileViewer from '@/components/molecules/course-preview/PreviewFileViewer';
import PreviewPptViewer from '@/components/molecules/course-preview/PreviewPptViewer';
import PreviewTextViewer from '@/components/molecules/course-preview/PreviewTextViewer';
import PreviewVideoViewer from '@/components/molecules/course-preview/PreviewVideoViewer';
import CourseQuizRunner from '@/components/organisms/Course/CourseQuizRunner';
import { Course } from '@/types';

type Lesson = {
    content: any;
    material: any;
    module: any;
};

interface LearningPageProps {
    course: Course;
    progress: Record<number, boolean>;
    certificate?: { id: number; certificate_number: string } | null;
    currentMaterial?: any | null;
    currentContent?: any | null;
    resume?: { material_id: number; content_id?: number | null } | null;
}

export default function LearningPage({ course, progress, certificate, currentContent, resume }: LearningPageProps) {
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
    const [markingComplete, setMarkingComplete] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        if (currentContent?.id) setSelectedContentId(currentContent.id);
        else if (resume?.content_id) setSelectedContentId(resume.content_id);
    }, [currentContent?.id, resume?.content_id]);

    const activeIndex = lessons.findIndex((l) => l.content.id === selectedContentId);
    const activeLesson = lessons[activeIndex] ?? lessons[0];
    const isVideo = activeLesson?.content.type === 'video';

    const materials = (course.modules ?? []).flatMap((m) => m.materials ?? []);
    const completedCount = materials.filter((m) => progress[m.id]).length;
    const progressPercent = materials.length ? Math.round((completedCount / materials.length) * 100) : 0;
    const isCompleted = Boolean(activeLesson && progress[activeLesson.material.id]);

    const selectContent = (contentId: number) => setSelectedContentId(contentId);
    const selectMaterial = (material: any) => {
        const first = material.contents?.[0];
        if (first) setSelectedContentId(first.id);
    };

    const markComplete = () => {
        if (!activeLesson || isCompleted) return;
        setMarkingComplete(true);
        router.post(
            `/student/courses/${course.slug}/progress`,
            { material_id: activeLesson.material.id },
            { preserveScroll: true, onFinish: () => setMarkingComplete(false) },
        );
    };

    return (
        <>
            <Head title={`${course.title} — Learning`} />

            {/* Sub-bar — course title + progress, sticks right under UserNavbar */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-2.5">
                <span className="max-w-sm truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{course.title}</span>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                            <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{progressPercent}%</span>
                    </div>
                    <span className="hidden text-xs text-slate-400 dark:text-slate-500 sm:inline">{completedCount}/{materials.length} done</span>
                </div>
            </div>

            {/* Content + Sidebar — fills exact remaining height (100vh - navbar 64px - subbar 41px) */}
            <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 105px)' }}>

                {/* Left: scrollable content */}
                <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-slate-50 dark:bg-slate-900">

                    {/* Certificate banner */}
                    {progressPercent === 100 && (
                        <div className="flex flex-col gap-4 border-b border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60">
                                    <Award size={18} className="text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-900 dark:text-amber-300">Course completed!</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-400">Your certificate is ready to download.</p>
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
                                    className="flex items-center gap-1.5 border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/30"
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
                                    <p className="mb-1 text-[11px] font-semibold tracking-widest text-purple-500 dark:text-purple-400 uppercase">
                                        {activeLesson.module.title}
                                    </p>
                                    <h1 className="text-xl font-bold leading-snug text-slate-900 dark:text-white sm:text-2xl">
                                        {activeLesson.content.title}
                                    </h1>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <Badge variant="purple">{activeLesson.content.type}</Badge>
                                        {activeLesson.material.title !== activeLesson.content.title && (
                                            <span className="text-xs text-slate-400 dark:text-slate-500">{activeLesson.material.title}</span>
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
                                        onClick={() => activeIndex > 0 && setSelectedContentId(lessons[activeIndex - 1].content.id)}
                                        className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-400 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronLeft size={14} /> Prev
                                    </button>
                                    <button
                                        type="button"
                                        disabled={activeIndex >= lessons.length - 1}
                                        onClick={() => activeIndex < lessons.length - 1 && setSelectedContentId(lessons[activeIndex + 1].content.id)}
                                        className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-400 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Content viewer */}
                            <div className={`overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs ${isVideo ? 'bg-slate-900' : 'bg-white dark:bg-slate-800'}`}>
                                <LessonViewer lesson={activeLesson} courseSlug={course.slug} />
                            </div>

                            {/* Mark complete bar */}
                            <div className="flex items-center justify-between border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-4 shadow-xs">
                                {isCompleted ? (
                                    <p className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 size={16} /> Material completed
                                    </p>
                                ) : (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Mark this material when you're done.</p>
                                )}
                                <Button
                                    onClick={markComplete}
                                    isLoading={markingComplete}
                                    disabled={isCompleted}
                                    leftIcon={<CheckCircle2 size={16} />}
                                    variant={isCompleted ? 'secondary' : 'primary'}
                                    size="md"
                                >
                                    {isCompleted ? 'Completed' : 'Mark as Complete'}
                                </Button>
                            </div>

                            <p className="pb-4 text-center text-xs text-slate-400 dark:text-slate-500">
                                Discussion & reviews on the{' '}
                                <Link href={`/course/${course.slug}`} className="font-medium text-purple-600 dark:text-purple-400 hover:underline">
                                    course page
                                </Link>
                            </p>
                        </div>
                    )}
                </div>

                {/* Right: sidebar */}
                {sidebarOpen ? (
                    <aside className="hidden w-80 shrink-0 flex-col border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 lg:flex xl:w-80">
                        {/* Sidebar header */}
                        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 dark:border-slate-700 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <BookOpen size={14} className="text-purple-600" />
                                <span className="text-xs font-bold tracking-wider text-slate-700 dark:text-slate-200 uppercase">Course Content</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSidebarOpen(false)}
                                title="Hide sidebar"
                                className="rounded p-1 text-slate-400 dark:text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-white"
                            >
                                <PanelLeftClose size={15} />
                            </button>
                        </div>

                        {/* Progress */}
                        <div className="shrink-0 border-b border-slate-100 dark:border-slate-700 px-4 py-3">
                            <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                <span>Progress</span>
                                <span className="font-bold text-purple-600 dark:text-purple-400">{progressPercent}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">{completedCount} of {materials.length} done</p>
                        </div>

                        {/* Module list — takes all remaining height and scrolls */}
                        <div className="flex-1 overflow-y-auto">
                            {(course.modules ?? []).map((mod, modIdx) => {
                                const expanded = expandedModules[mod.id] ?? true;
                                return (
                                    <div key={mod.id} className="border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                                        <button
                                            type="button"
                                            onClick={() => setExpandedModules((v) => ({ ...v, [mod.id]: !expanded }))}
                                            className="flex w-full items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                                        >
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                                <span className="mr-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                                    {String(modIdx + 1).padStart(2, '0')}
                                                </span>
                                                {mod.title}
                                            </span>
                                            <ChevronDown
                                                size={13}
                                                className={`shrink-0 text-slate-400 dark:text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
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
                                                                        ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400'
                                                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                                                                }`}
                                                            >
                                                                {done ? (
                                                                    <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />
                                                                ) : (
                                                                    <Circle size={13} className="shrink-0 text-slate-300 dark:text-slate-600" />
                                                                )}
                                                                <span className="truncate">{mat.title}</span>
                                                            </button>

                                                            {(mat.contents ?? []).length > 1 && (
                                                                <div className="pl-10 pr-4">
                                                                    {(mat.contents ?? []).map((con) => {
                                                                        const activeCon = activeLesson?.content.id === con.id;
                                                                        return (
                                                                            <button
                                                                                key={con.id}
                                                                                type="button"
                                                                                onClick={() => selectContent(con.id)}
                                                                                className={`flex w-full items-center gap-1.5 py-1.5 text-left text-[11px] transition-colors ${
                                                                                    activeCon
                                                                                        ? 'font-semibold text-purple-600 dark:text-purple-400'
                                                                                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                                                                                }`}
                                                                            >
                                                                                {con.type === 'video' ? (
                                                                                    <PlayCircle size={11} className="shrink-0" />
                                                                                ) : (
                                                                                    <FileText size={11} className="shrink-0" />
                                                                                )}
                                                                                <span className="truncate">{con.title}</span>
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
                            className="group pointer-events-auto flex items-center gap-2 rounded-l-full border border-r-0 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-3 pl-4 pr-3 text-slate-500 dark:text-slate-400 shadow-lg transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-400"
                        >
                            <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-semibold transition-all duration-200 group-hover:max-w-[5rem] group-hover:pr-1">
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

function LessonViewer({ lesson, courseSlug }: { lesson: Lesson; courseSlug?: string }) {
    const { content } = lesson;
    if (content.type === 'video') return <PreviewVideoViewer title={content.title} contentUrl={content.content_url} />;
    if (content.type === 'text') return <div className="p-6 sm:p-8"><PreviewTextViewer contentText={content.content_text} /></div>;
    if (content.type === 'file') return <PreviewFileViewer title={content.title} contentUrl={content.content_url} />;
    if (content.type === 'ppt') return <PreviewPptViewer title={content.title} contentUrl={content.content_url} />;
    if (content.type === 'quiz')
        return (
            <div className="p-6">
                <CourseQuizRunner
                    title={content.title}
                    duration={content.duration}
                    quizQuestions={content.quiz_questions}
                    courseSlug={courseSlug}
                    contentId={content.id}
                />
            </div>
        );
    return <div className="p-10 text-center text-sm text-slate-400 dark:text-slate-500">This lesson format is not supported.</div>;
}

// Layout: UserNavbar h-16 (64px) + subbar py-2.5 + border ~41px = ~105px
LearningPage.layout = (page: React.ReactNode) => (
    <div className="flex h-screen flex-col overflow-hidden">
        <UserNavbar />
        {page}
    </div>
);
