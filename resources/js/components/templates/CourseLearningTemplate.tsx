import { Head, Link, router, usePage } from '@inertiajs/react';
import clsx from 'clsx';
import {
    Award,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Circle,
    Download,
    FileText,
    FolderDown,
    GraduationCap,
    HelpCircle,
    Moon,
    PanelLeftClose,
    PanelLeftOpen,
    PlayCircle,
    Presentation,
    Sun,
    Video,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import AppLogo from '@/components/atoms/AppLogo';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import PreviewFileViewer from '@/components/molecules/course-preview/PreviewFileViewer';
import PreviewPptViewer from '@/components/molecules/course-preview/PreviewPptViewer';
import PreviewTextViewer from '@/components/molecules/course-preview/PreviewTextViewer';
import PreviewVideoViewer from '@/components/molecules/course-preview/PreviewVideoViewer';
import RefundPolicyNotice from '@/components/molecules/RefundPolicyNotice';
import CourseQuizRunner, { type QuizQuestion, type QuizState } from '@/components/organisms/Course/CourseQuizRunner';
import { useInertiaToast } from '@/hooks/useInertiaToast';
import { useTheme } from '@/hooks/useTheme';
import type { Course, CourseResource, Material, MaterialContent, Module, RefundPolicy } from '@/types';
import type { SharedPageProps } from '@/types/shared';

type LessonContent = MaterialContent & {
    quiz_questions?: QuizQuestion[];
};

type MaterialPage = {
    material: Material & { contents?: LessonContent[] };
    module: Module;
};

interface CourseLearningTemplateProps {
    course: Course;
    progress?: Record<number, boolean>;
    contentProgress?: Record<number, boolean>;
    quizStates?: Record<number, QuizState>;
    certificate?: { id: number; certificate_number: string } | null;
    currentMaterial?: (Material & { contents?: LessonContent[] }) | null;
    currentContent?: LessonContent | null;
    currentSectionId?: number | null;
    resume?: { material_id: number; content_id?: number | null } | null;
    resources?: CourseResource[];
    resourcesUnlocked?: boolean;
    refundPolicy?: RefundPolicy | null;
    mode?: 'learning' | 'preview';
}

function getCsrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

function publishedContents(material: Material & { contents?: LessonContent[] }, isPreview: boolean): LessonContent[] {
    return ((material.contents ?? []) as LessonContent[]).filter((content) => isPreview || content.status === 'published');
}

export default function CourseLearningTemplate({
    course,
    progress = {},
    contentProgress,
    quizStates,
    certificate,
    currentMaterial,
    currentContent,
    resume,
    resources = [],
    resourcesUnlocked = false,
    refundPolicy,
    mode = 'learning',
}: CourseLearningTemplateProps) {
    useInertiaToast();
    const { toggle: toggleTheme, isDark } = useTheme();
    const { auth } = usePage<SharedPageProps>().props;

    const isPreview = mode === 'preview';
    const rolePrefix = auth?.user?.role ?? 'student';
    const exitHref = isPreview ? `/${rolePrefix}/courses/${course.slug}` : '/student/courses';
    const exitTitle = isPreview ? 'Exit preview and return to course management' : 'Quit course and return to My Learning';

    const pages = useMemo<MaterialPage[]>(
        () =>
            (course.modules ?? []).flatMap((mod) =>
                ((mod.materials ?? []) as (Material & { contents?: LessonContent[] })[])
                    .filter((mat) => isPreview || mat.status === 'published')
                    .map((material) => ({ material, module: mod })),
            ),
        [course, isPreview],
    );

    const allContentBlocks = useMemo(() => pages.flatMap((page) => publishedContents(page.material, isPreview)), [pages, isPreview]);

    const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(() => {
        if (currentMaterial?.id && pages.some((page) => page.material.id === currentMaterial.id)) {
            return currentMaterial.id;
        }

        if (currentContent?.id) {
            const found = pages.find((page) => publishedContents(page.material, isPreview).some((content) => content.id === currentContent.id));
            if (found) return found.material.id;
        }

        if (resume?.material_id && pages.some((page) => page.material.id === resume.material_id)) {
            return resume.material_id;
        }

        if (resume?.content_id) {
            const found = pages.find((page) => publishedContents(page.material, isPreview).some((content) => content.id === resume.content_id));
            if (found) return found.material.id;
        }

        return pages[0]?.material.id ?? null;
    });

    const [pendingBlockId, setPendingBlockId] = useState<number | null>(() => {
        if (currentContent?.id && allContentBlocks.some((content) => content.id === currentContent.id)) {
            return currentContent.id;
        }

        if (resume?.content_id && allContentBlocks.some((content) => content.id === resume.content_id)) {
            return resume.content_id;
        }

        return null;
    });

    const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>(() =>
        Object.fromEntries((course.modules ?? []).map((m) => [m.id, true])),
    );
    const [expandedMaterials, setExpandedMaterials] = useState<Record<number, boolean>>(() =>
        Object.fromEntries(
            (course.modules ?? []).flatMap((mod) =>
                ((mod.materials ?? []) as (Material & { contents?: LessonContent[] })[])
                    .filter((mat) => isPreview || mat.status === 'published')
                    .map((mat) => [mat.id, true]),
            ),
        ),
    );
    const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : true));
    const [sidebarTab, setSidebarTab] = useState<'modules' | 'resources'>('modules');
    const [contentProgressState, setContentProgressState] = useState<Record<number, boolean>>(contentProgress ?? {});
    const [quizStatesState, setQuizStatesState] = useState<Record<number, QuizState>>(quizStates ?? {});
    const scrollRef = useRef<HTMLDivElement>(null);
    const completingContentRef = useRef<Set<number>>(new Set());
    const pendingCompletionsRef = useRef<Map<number, Promise<unknown>>>(new Map());
    const autoCompletedMaterialsRef = useRef<Set<number>>(new Set());
    const contentProgressRef = useRef<Record<number, boolean>>(contentProgress ?? {});

    useEffect(() => {
        setContentProgressState(contentProgress ?? {});
    }, [contentProgress]);

    useEffect(() => {
        contentProgressRef.current = contentProgressState;
    }, [contentProgressState]);

    useEffect(() => {
        setQuizStatesState(quizStates ?? {});
    }, [quizStates]);

    useEffect(() => {
        setSidebarTab('modules');
    }, [course.id]);

    const scrollToBlock = (blockId: number) => {
        const el = document.getElementById(`content-block-${blockId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return true;
        }

        return false;
    };

    useEffect(() => {
        if (!selectedMaterialId) return;
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [selectedMaterialId]);

    useEffect(() => {
        if (!pendingBlockId) return;

        let attempts = 0;
        const tryScroll = () => {
            if (scrollToBlock(pendingBlockId)) {
                setPendingBlockId(null);
                return;
            }

            attempts += 1;
            if (attempts < 20) {
                window.setTimeout(tryScroll, 75);
            }
        };

        const timer = window.setTimeout(tryScroll, 50);

        return () => window.clearTimeout(timer);
    }, [pendingBlockId, selectedMaterialId]);

    const activeIndex = pages.findIndex((page) => page.material.id === selectedMaterialId);
    const activePage = pages[activeIndex] ?? pages[0];
    const activeBlocks = activePage ? publishedContents(activePage.material, isPreview) : [];
    const courseResources = resources.length > 0 ? resources : (course.resources ?? []);

    const materials = pages.map((page) => page.material);
    const completedCount = materials.filter((m) => progress[m.id]).length;
    const progressPercent = materials.length ? Math.round((completedCount / materials.length) * 100) : 0;

    const totalContents = allContentBlocks.length;
    const completedContents = allContentBlocks.filter((block) => Boolean(contentProgressState[block.id])).length;
    const contentPercent = totalContents ? Math.round((completedContents / totalContents) * 100) : 0;

    const closeSidebarOnMobile = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    };

    const selectMaterial = (materialId: number, blockId?: number | null) => {
        const ownerPage = pages.find((page) => page.material.id === materialId);
        if (ownerPage) {
            setExpandedModules((prev) => ({ ...prev, [ownerPage.module.id]: true }));
            setExpandedMaterials((prev) => ({ ...prev, [materialId]: true }));
        }

        setSelectedMaterialId(materialId);
        setPendingBlockId(blockId ?? null);
        closeSidebarOnMobile();
    };

    const completeMaterialWhenReady = async (contentId: number, progressMap: Record<number, boolean>) => {
        if (isPreview) {
            return;
        }

        const ownerPage = pages.find((page) => publishedContents(page.material, isPreview).some((block) => block.id === contentId));
        if (!ownerPage) {
            return;
        }

        const materialId = ownerPage.material.id;
        const blocks = publishedContents(ownerPage.material, isPreview);
        const mergedProgress = { ...contentProgressRef.current, ...progressMap };
        const allContentsDone = blocks.length > 0 && blocks.every((block) => Boolean(mergedProgress[block.id]));

        if (!allContentsDone || progress[materialId] || autoCompletedMaterialsRef.current.has(materialId)) {
            return;
        }

        autoCompletedMaterialsRef.current.add(materialId);

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

        const nextProgress = { ...contentProgressState, [contentId]: true };
        setContentProgressState(nextProgress);

        if (isPreview) {
            return;
        }

        completingContentRef.current.add(contentId);

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
            .then(async (response) => {
                let data: { success?: boolean } = {};

                try {
                    data = await response.json();
                } catch {
                    data = {};
                }

                if (!response.ok || data.success === false) {
                    throw new Error('Content completion was not saved.');
                }

                return true;
            })
            .catch(() => {
                setContentProgressState((prev) => {
                    const next = { ...prev };
                    delete next[contentId];
                    return next;
                });

                toast.error('Failed to save progress. Please try again.');

                return false;
            })
            .finally(() => {
                completingContentRef.current.delete(contentId);
                pendingCompletionsRef.current.delete(contentId);
            });

        pendingCompletionsRef.current.set(contentId, request);
        void request.then((ok) => {
            if (ok) {
                return completeMaterialWhenReady(contentId, nextProgress);
            }

            return undefined;
        });
    };

    const scrollToNextBlock = (currentBlockId: number) => {
        if (!activePage) return;
        const index = activeBlocks.findIndex((block) => block.id === currentBlockId);
        if (index >= 0 && index < activeBlocks.length - 1) {
            scrollToBlock(activeBlocks[index + 1].id);
        }
    };

    const handleScroll = () => {
        const container = scrollRef.current;
        if (!container) return;

        const blockElements = container.querySelectorAll<HTMLElement>('[data-content-block-id]');
        if (blockElements.length === 0) return;

        const containerRect = container.getBoundingClientRect();

        for (const el of blockElements) {
            const blockId = Number(el.dataset.contentBlockId);
            const blockType = el.dataset.contentBlockType;
            if (blockType === 'text' && !contentProgressState[blockId]) {
                const rect = el.getBoundingClientRect();
                if (rect.bottom <= containerRect.bottom + 40) {
                    completeContent(blockId);
                }
            }
        }
    };

    const maybeCompleteVisibleTextBlocks = () => {
        const container = scrollRef.current;
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const blockElements = container.querySelectorAll<HTMLElement>('[data-content-block-id][data-content-block-type="text"]');

        for (const el of blockElements) {
            const blockId = Number(el.dataset.contentBlockId);
            if (!blockId || contentProgressState[blockId]) continue;

            const rect = el.getBoundingClientRect();
            const fullyVisible = rect.bottom <= containerRect.bottom + 40;
            const shortEnough = rect.height <= container.clientHeight + 40;

            if (fullyVisible || (shortEnough && rect.top >= containerRect.top - 40)) {
                completeContent(blockId);
            }
        }
    };

    useEffect(() => {
        if (!activeBlocks.some((block) => block.type === 'text')) return;

        const timer = window.setTimeout(maybeCompleteVisibleTextBlocks, 300);

        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMaterialId, activeBlocks.length]);

    return (
        <>
            <Head title={isPreview ? `Preview: ${course.title}` : `${course.title} — Learning`} />

            <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 sm:gap-3 sm:px-4 dark:border-slate-700 dark:bg-[#1e1f24]">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <Link href="/" className="flex shrink-0 items-center" aria-label="Go to home">
                        <AppLogo className="h-7 w-auto sm:h-8" />
                    </Link>
                    <div className="flex min-w-0 items-center gap-2">
                        <p className="max-w-[10rem] truncate text-xs font-semibold text-slate-800 sm:max-w-xs sm:text-sm md:max-w-md lg:max-w-xl dark:text-slate-100">
                            {course.title}
                        </p>
                        {isPreview && (
                            <Badge variant="purple" className="shrink-0 !rounded-none">
                                Preview
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSidebarOpen((value) => !value)}
                        title={sidebarOpen ? 'Hide course content' : 'Show course content'}
                        aria-label={sidebarOpen ? 'Hide course content' : 'Show course content'}
                        leftIcon={<PanelLeftOpen size={16} />}
                        className="!h-8 !w-8 shrink-0 !rounded-none !border-slate-200 !p-0 !text-slate-500 hover:!border-purple-300 hover:!bg-purple-50 hover:!text-purple-600 lg:hidden dark:!border-slate-700 dark:!text-slate-400 dark:hover:!border-purple-600 dark:hover:!bg-purple-950/40 dark:hover:!text-purple-400"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={toggleTheme}
                        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        leftIcon={isDark ? <Sun size={16} /> : <Moon size={16} />}
                        className="!h-8 !w-8 shrink-0 !rounded-none !border-slate-200 !p-0 !text-slate-500 hover:!border-purple-300 hover:!bg-purple-50 hover:!text-purple-600 dark:!border-slate-700 dark:!text-slate-400 dark:hover:!border-purple-600 dark:hover:!bg-purple-950/40 dark:hover:!text-purple-400"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.visit(exitHref)}
                        title={exitTitle}
                        aria-label={exitTitle}
                        leftIcon={<X size={17} />}
                        className="!h-8 !w-8 shrink-0 !rounded-none !border-slate-200 !p-0 !text-slate-500 hover:!border-rose-300 hover:!bg-rose-50 hover:!text-rose-600 dark:!border-slate-700 dark:!text-slate-400 dark:hover:!border-rose-900 dark:hover:!bg-rose-950/40 dark:hover:!text-rose-400"
                    />
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-black"
                >
                    {!isPreview && <RefundPolicyNotice policy={refundPolicy} />}

                    {progressPercent === 100 && (
                        <div className="flex flex-col gap-4 border-b border-amber-200 bg-amber-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-amber-900/50 dark:bg-amber-950/30">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60">
                                    <Award size={18} className="text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-900 dark:text-amber-300">Course completed!</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-400">Your certificate is ready to download.</p>
                                </div>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2">
                                {certificate && (
                                    <a href={`/student/certificates/${certificate.id}/download`} download>
                                        <Button
                                            size="sm"
                                            leftIcon={<Download size={13} />}
                                            className="!rounded-none !bg-amber-500 hover:!bg-amber-400"
                                        >
                                            Download Certificate
                                        </Button>
                                    </a>
                                )}
                                <Link href="/student/certificates">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="!rounded-none !border-amber-300 !bg-white !text-amber-800 hover:!bg-amber-50 dark:!border-amber-800 dark:!bg-[#1e1f24] dark:!text-amber-300 dark:hover:!bg-amber-950/30"
                                    >
                                        View All
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}

                    {!activePage ? (
                        <div className="flex flex-1 flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                            <GraduationCap className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
                            <p className="text-sm">No lesson available yet.</p>
                        </div>
                    ) : (
                        <div className="mx-auto w-full max-w-7xl p-2 sm:p-4">
                            <div className="overflow-hidden border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-[#1e1f24]">
                                <div className="border-b border-slate-100 p-3 sm:p-5 dark:border-slate-700">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0 space-y-1">
                                            <p className="text-[10px] leading-relaxed font-semibold tracking-wide text-purple-600 uppercase sm:text-[11px] sm:tracking-widest dark:text-purple-400">
                                                {activePage.module.title}
                                            </p>
                                            <h1 className="text-lg leading-snug font-bold text-slate-900 sm:text-2xl dark:text-white">
                                                {activePage.material.title}
                                            </h1>
                                            {activePage.material.description ? (
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{activePage.material.description}</p>
                                            ) : null}
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <Badge variant="purple">
                                                    {activeBlocks.length} {activeBlocks.length === 1 ? 'content block' : 'content blocks'}
                                                </Badge>
                                                {progress[activePage.material.id] ? <Badge variant="success">Completed</Badge> : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {activeBlocks.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-slate-500 sm:p-12 dark:text-slate-400">
                                        <FileText className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
                                        <p className="font-semibold text-slate-700 dark:text-slate-200">No content yet</p>
                                        <p className="mt-1 text-xs text-slate-400">This material does not have any published content yet.</p>
                                    </div>
                                ) : (
                                    <div>
                                        {activeBlocks.map((block) => {
                                            const isBlockVideo = block.type === 'video';
                                            const blockDone = Boolean(contentProgressState[block.id]);

                                            return (
                                                <section
                                                    key={block.id}
                                                    id={`content-block-${block.id}`}
                                                    data-content-block-id={block.id}
                                                    data-content-block-type={block.type}
                                                    className="min-w-0 scroll-mt-6 border-b border-slate-100 last:border-b-0 dark:border-slate-700"
                                                >
                                                    <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-3 py-2.5 sm:px-5 dark:border-slate-700 dark:bg-slate-800/40">
                                                        {blockDone ? (
                                                            <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                                                        ) : (
                                                            <SectionTypeIcon type={block.type} className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                        )}
                                                        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700 sm:text-sm dark:text-slate-200">
                                                            {block.title}
                                                        </span>
                                                        <span className="shrink-0 text-[10px] font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                                                            {block.type}
                                                        </span>
                                                    </div>

                                                    <div className={isBlockVideo ? 'bg-[#141416]' : 'bg-white dark:bg-[#1e1f24]'}>
                                                        <LessonViewer
                                                            content={block}
                                                            courseSlug={isPreview ? undefined : course.slug}
                                                            quizState={quizStatesState?.[block.id]}
                                                            onQuizStateChange={(state) =>
                                                                setQuizStatesState((prev) => ({
                                                                    ...prev,
                                                                    [block.id]: state,
                                                                }))
                                                            }
                                                            onVideoCompleted={() => {
                                                                completeContent(block.id, false);
                                                                scrollToNextBlock(block.id);
                                                            }}
                                                            onOpenAttachment={() => completeContent(block.id)}
                                                            onQuizCompleted={() => {
                                                                completeContent(block.id, true);
                                                                scrollToNextBlock(block.id);
                                                            }}
                                                        />
                                                    </div>
                                                </section>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="flex flex-col gap-4 border-t border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4 dark:border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={activeIndex <= 0}
                                            onClick={() => activeIndex > 0 && selectMaterial(pages[activeIndex - 1].material.id)}
                                            leftIcon={<ChevronLeft size={14} />}
                                            title="Previous material"
                                            aria-label="Previous material"
                                            className="!h-8 !w-8 !rounded-none !p-0"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={activeIndex >= pages.length - 1}
                                            onClick={() => activeIndex < pages.length - 1 && selectMaterial(pages[activeIndex + 1].material.id)}
                                            leftIcon={<ChevronRight size={14} />}
                                            title="Next material"
                                            aria-label="Next material"
                                            className="!h-8 !w-8 !rounded-none !p-0"
                                        />
                                    </div>

                                    <p className="text-center text-xs text-slate-400 sm:text-right dark:text-slate-500">
                                        Discussion & reviews on the{' '}
                                        <Link
                                            href={`/course/${course.slug}`}
                                            className="font-medium text-purple-600 hover:underline dark:text-purple-400"
                                        >
                                            course page
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {sidebarOpen ? (
                    <>
                        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
                        <aside
                            className={clsx(
                                'fixed inset-y-0 right-0 z-50 flex w-[85vw] max-w-80 shrink-0 flex-col border-l border-slate-200 bg-white lg:static lg:w-80 dark:border-slate-700 dark:bg-[#1e1f24]',
                                'transform transition-transform duration-300',
                                sidebarOpen ? 'translate-x-0' : '-translate-x-full',
                                'lg:translate-x-0',
                            )}
                        >
                            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                    <BookOpen size={14} className="text-purple-600" />
                                    <span className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-200">
                                        Course Content
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSidebarOpen(false)}
                                    title="Hide sidebar"
                                    aria-label="Hide sidebar"
                                    leftIcon={<PanelLeftClose size={15} />}
                                    className="!h-8 !w-8 !rounded-none !p-0"
                                />
                            </div>

                            <div className="shrink-0 border-b border-slate-100 px-4 py-3 dark:border-slate-700">
                                <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                    <span>Progress</span>
                                    <span className="font-bold text-purple-600 dark:text-purple-400">{contentPercent}%</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                    <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${contentPercent}%` }} />
                                </div>
                                <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                                    {completedContents} of {totalContents} done
                                </p>
                            </div>

                            <div className="shrink-0 border-b border-slate-100 px-4 dark:border-slate-700">
                                <div className="flex">
                                    <button
                                        type="button"
                                        onClick={() => setSidebarTab('modules')}
                                        className={clsx(
                                            'flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors',
                                            sidebarTab === 'modules'
                                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
                                        )}
                                    >
                                        <BookOpen size={13} /> Modules
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSidebarTab('resources')}
                                        className={clsx(
                                            'flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors',
                                            sidebarTab === 'resources'
                                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
                                        )}
                                    >
                                        <FolderDown size={13} /> Resources
                                        {courseResources.length > 0 && (
                                            <span className="border border-purple-300 bg-white px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:border-purple-700 dark:bg-[#1e1f24] dark:text-purple-300">
                                                {courseResources.length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {sidebarTab === 'modules' && (
                                <div className="flex-1 overflow-y-auto">
                                    {(course.modules ?? []).map((mod, modIdx) => {
                                        const expanded = expandedModules[mod.id] ?? true;

                                        return (
                                            <div key={mod.id} className="border-b border-slate-100 last:border-b-0 dark:border-slate-700">
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedModules((v) => ({ ...v, [mod.id]: !expanded }))}
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
                                                        {((mod.materials ?? []) as (Material & { contents?: LessonContent[] })[])
                                                            .filter((mat) => isPreview || mat.status === 'published')
                                                            .map((mat) => {
                                                                const done = Boolean(progress[mat.id]);
                                                                const activeMat = activePage?.material.id === mat.id;
                                                                const blocks = publishedContents(mat, isPreview);
                                                                const materialExpanded = expandedMaterials[mat.id] ?? true;

                                                                return (
                                                                    <div key={mat.id}>
                                                                        <div
                                                                            className={`flex items-center transition-colors ${
                                                                                activeMat
                                                                                    ? 'bg-purple-50 dark:bg-purple-950/40'
                                                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                                                                            }`}
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => selectMaterial(mat.id)}
                                                                                className={`flex min-w-0 flex-1 items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold transition-colors ${
                                                                                    activeMat
                                                                                        ? 'text-purple-700 dark:text-purple-400'
                                                                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                                                                                }`}
                                                                            >
                                                                                {done ? (
                                                                                    <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />
                                                                                ) : (
                                                                                    <Circle
                                                                                        size={13}
                                                                                        className="shrink-0 text-slate-300 dark:text-slate-600"
                                                                                    />
                                                                                )}
                                                                                <span className="truncate">{mat.title}</span>
                                                                            </button>
                                                                            {blocks.length > 0 && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(event) => {
                                                                                        event.stopPropagation();
                                                                                        setExpandedMaterials((prev) => ({
                                                                                            ...prev,
                                                                                            [mat.id]: !(prev[mat.id] ?? true),
                                                                                        }));
                                                                                    }}
                                                                                    aria-label={
                                                                                        materialExpanded
                                                                                            ? 'Collapse content blocks'
                                                                                            : 'Expand content blocks'
                                                                                    }
                                                                                    title={
                                                                                        materialExpanded
                                                                                            ? 'Collapse content blocks'
                                                                                            : 'Expand content blocks'
                                                                                    }
                                                                                    className="mr-2 shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                                                                                >
                                                                                    <ChevronDown
                                                                                        size={13}
                                                                                        className={clsx(
                                                                                            'transition-transform',
                                                                                            materialExpanded ? 'rotate-180' : '',
                                                                                        )}
                                                                                    />
                                                                                </button>
                                                                            )}
                                                                        </div>

                                                                        {blocks.length > 0 && materialExpanded && (
                                                                            <div className="pr-3 pb-1 pl-9">
                                                                                {blocks.map((block) => {
                                                                                    const blockDone = Boolean(contentProgressState[block.id]);

                                                                                    return (
                                                                                        <button
                                                                                            key={block.id}
                                                                                            type="button"
                                                                                            onClick={() => selectMaterial(mat.id, block.id)}
                                                                                            className={clsx(
                                                                                                'flex w-full items-center gap-1.5 py-1.5 text-left text-[11px] transition-colors',
                                                                                                activeMat
                                                                                                    ? 'text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400'
                                                                                                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
                                                                                            )}
                                                                                            title={block.title}
                                                                                        >
                                                                                            {blockDone ? (
                                                                                                <CheckCircle2
                                                                                                    size={10}
                                                                                                    className="shrink-0 text-emerald-500"
                                                                                                />
                                                                                            ) : (
                                                                                                <SectionTypeIcon
                                                                                                    type={block.type}
                                                                                                    className="h-2.5 w-2.5 shrink-0"
                                                                                                />
                                                                                            )}
                                                                                            <span className="truncate">{block.title}</span>
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
                            )}

                            {sidebarTab === 'resources' && (
                                <div className="flex-1 overflow-y-auto px-4 py-3">
                                    {courseResources.length > 0 ? (
                                        <div className="border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                                            <div className="flex items-center gap-2">
                                                <FolderDown size={16} className="text-emerald-600 dark:text-emerald-400" />
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Course Resources</h3>
                                                <span className="border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                                    {courseResources.length}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                {resourcesUnlocked
                                                    ? 'You completed every material — these resources are now unlocked.'
                                                    : 'Resources from the lessons you have completed are available. Finish the rest to unlock everything.'}
                                            </p>
                                            <ul className="mt-4 divide-y divide-emerald-100 dark:divide-emerald-900/40">
                                                {courseResources.map((resource) => (
                                                    <li
                                                        key={`${resource.source ?? 'manual'}-${resource.id}`}
                                                        className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{resource.title}</p>
                                                            {resource.description && (
                                                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                                    {resource.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <a
                                                            href={resource.download_url ?? resource.url ?? '#'}
                                                            target={resource.download_url ? undefined : '_blank'}
                                                            rel="noreferrer"
                                                            aria-label={`Download ${resource.title}`}
                                                        >
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                leftIcon={<Download size={13} />}
                                                                className="!rounded-none !border-emerald-300 !bg-white !text-emerald-700 hover:!bg-emerald-100 dark:!border-emerald-800 dark:!bg-[#1e1f24] dark:!text-emerald-300 dark:hover:!bg-emerald-950/40"
                                                            />
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : (
                                        <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">No resources yet.</p>
                                    )}
                                </div>
                            )}
                        </aside>
                    </>
                ) : (
                    <div className="pointer-events-none fixed top-1/2 right-0 z-50 -translate-y-1/2 lg:block">
                        <button
                            type="button"
                            onClick={() => {
                                setSidebarOpen(true);
                                setSidebarTab('modules');
                            }}
                            title={sidebarTab === 'resources' ? 'Show course resources' : 'Show course content'}
                            className="group pointer-events-auto flex items-center gap-2 rounded-l-full border border-r-0 border-slate-200 bg-white py-3 pr-3 pl-4 text-slate-500 shadow-lg transition-all duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-400 dark:hover:border-purple-600 dark:hover:bg-purple-950/40 dark:hover:text-purple-400"
                        >
                            <span className="max-w-0 overflow-hidden text-xs font-semibold whitespace-nowrap transition-all duration-200 group-hover:max-w-[5rem] group-hover:pr-1">
                                {sidebarTab === 'resources' ? 'Resources' : 'Contents'}
                            </span>
                            <PanelLeftOpen size={15} className="shrink-0" />
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

function SectionTypeIcon({ type, className }: { type: string; className?: string }) {
    const cls = className ?? 'h-3.5 w-3.5';

    if (type === 'video') return <Video className={cls} />;
    if (type === 'quiz') return <HelpCircle className={cls} />;
    if (type === 'ppt') return <Presentation className={cls} />;
    if (type === 'file') return <FileText className={cls} />;

    return <PlayCircle className={cls} />;
}

function LessonViewer({
    content,
    courseSlug,
    quizState,
    onQuizStateChange,
    onVideoCompleted,
    onOpenAttachment,
    onQuizCompleted,
}: {
    content: LessonContent;
    courseSlug?: string;
    quizState?: QuizState;
    onQuizStateChange: (state: QuizState) => void;
    onVideoCompleted: () => void;
    onOpenAttachment: () => void;
    onQuizCompleted: () => void;
}) {
    if (content.type === 'video') {
        return <PreviewVideoViewer title={content.title} contentUrl={content.content_url} onCompleted={onVideoCompleted} />;
    }

    if (content.type === 'text') {
        return (
            <div className="p-4 sm:p-8">
                <PreviewTextViewer contentText={content.content_text} />
            </div>
        );
    }

    if (content.type === 'file') {
        return (
            <PreviewFileViewer title={content.title} contentUrl={content.content_url} previewUrl={content.preview_url} onOpen={onOpenAttachment} />
        );
    }

    if (content.type === 'ppt') {
        return <PreviewPptViewer title={content.title} contentUrl={content.content_url} previewUrl={content.preview_url} onOpen={onOpenAttachment} />;
    }

    if (content.type === 'quiz') {
        return (
            <div className="p-2 sm:p-6">
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

    return <div className="p-10 text-center text-sm text-slate-400 dark:text-slate-500">This lesson format is not supported.</div>;
}

/** Shared full-screen layout used by the student player and both preview pages. */
export function CourseLearningLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-dvh flex-col overflow-hidden bg-gray-100 dark:bg-black">
            {children}
            <ToastContainer position="top-right" autoClose={4000} newestOnTop pauseOnHover closeOnClick />
        </div>
    );
}
