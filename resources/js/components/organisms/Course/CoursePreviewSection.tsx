import React, { useMemo, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import CoursePreviewHeader from '@/components/organisms/Course/CoursePreviewHeader';
import CourseOutlineSidebar from '@/components/organisms/Course/CourseOutlineSidebar';

import PreviewVideoViewer from '@/components/molecules/course-preview/PreviewVideoViewer';
import PreviewTextViewer from '@/components/molecules/course-preview/PreviewTextViewer';
import PreviewFileViewer from '@/components/molecules/course-preview/PreviewFileViewer';
import PreviewPptViewer from '@/components/molecules/course-preview/PreviewPptViewer';
import CourseQuizRunner from '@/components/organisms/Course/CourseQuizRunner';

import { Course } from '@/types';

interface FlatContentItem {
    content: any;
    materialTitle: string;
    moduleTitle: string;
}

export default function CoursePreviewSection({ course }: { course: Course }) {
    const { auth } = usePage().props as any;
    const rolePrefix = auth?.user?.role ?? 'admin';

    const flatContents = useMemo(() => {
        const list: FlatContentItem[] = [];

        course.modules?.forEach((module) => {
            module.materials?.forEach((material) => {
                material.contents?.forEach((content) => {
                    list.push({
                        content,
                        materialTitle: material.title,
                        moduleTitle: module.title,
                    });
                });
            });
        });

        return list;
    }, [course]);

    const [selectedContentId, setSelectedContentId] = useState<number | null>(flatContents.length > 0 ? flatContents[0].content.id : null);

    const activeItemIndex = useMemo(() => {
        return flatContents.findIndex((item) => item.content.id === selectedContentId);
    }, [flatContents, selectedContentId]);

    const activeItem = useMemo(() => {
        if (activeItemIndex >= 0) return flatContents[activeItemIndex];
        return flatContents[0] ?? null;
    }, [flatContents, activeItemIndex]);

    const handleSelectContent = (id: number) => {
        setSelectedContentId(id);
    };

    const handlePrev = () => {
        if (activeItemIndex > 0) {
            setSelectedContentId(flatContents[activeItemIndex - 1].content.id);
        }
    };

    const handleNext = () => {
        if (activeItemIndex < flatContents.length - 1) {
            setSelectedContentId(flatContents[activeItemIndex + 1].content.id);
        }
    };

    return (
        <div className="max-w-8xl mx-auto space-y-6">
            {/* Header Banner */}
            <CoursePreviewHeader course={course} />

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                {/* Left Outline Sidebar */}
                <aside className="space-y-4 lg:col-span-4">
                    <CourseOutlineSidebar
                        modules={course.modules ?? []}
                        totalItemsCount={flatContents.length}
                        selectedContentId={selectedContentId}
                        onSelectContent={handleSelectContent}
                    />
                </aside>

                {/* Right Content Workspace */}
                <main className="space-y-4 lg:col-span-8">
                    {!activeItem ? (
                        <div className="space-y-3 rounded-none border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e1f24] p-8 text-center text-slate-600 dark:text-slate-300 shadow-xs">
                            <BookOpen className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-500" />
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Material Content to Display</h3>
                            <p className="mx-auto max-w-sm text-xs text-slate-500 dark:text-slate-400">
                                This course does not have any lesson materials added yet. Please add modules and materials first.
                            </p>
                            <Link href={`/${rolePrefix}/courses/${course.slug}`}>
                                <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="h-3.5 w-3.5" />} className="!rounded-none">
                                    Back to Course Management
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-5 rounded-none border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e1f24] p-6 shadow-xs">
                            {/* Header Bar within Content Workspace */}
                            <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-slate-700 pb-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                                        <span className="font-medium text-purple-600 dark:text-purple-400">{activeItem.moduleTitle}</span>
                                        <span>/</span>
                                        <span>{activeItem.materialTitle}</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{activeItem.content.title}</h2>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="purple" className="!rounded-none">
                                            {activeItem.content.type}
                                        </Badge>
                                        <Badge variant={activeItem.content.status === 'published' ? 'success' : 'warning'} className="!rounded-none">
                                            {activeItem.content.status}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Pagination Prev/Next */}
                                <div className="flex shrink-0 items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="md"
                                        onClick={handlePrev}
                                        disabled={activeItemIndex <= 0}
                                        leftIcon={<ChevronLeft className="h-[18px] w-[18px]" />}
                                        className="!rounded-none"
                                    >
                                        Prev
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="md"
                                        onClick={handleNext}
                                        disabled={activeItemIndex >= flatContents.length - 1}
                                        rightIcon={<ChevronRight className="h-[18px] w-[18px]" />}
                                        className="!rounded-none"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>

                            {/* Seamless Material Content Viewer */}
                            <div>
                                {activeItem.content.type === 'video' && (
                                    <PreviewVideoViewer title={activeItem.content.title} contentUrl={activeItem.content.content_url} />
                                )}

                                {activeItem.content.type === 'text' && <PreviewTextViewer contentText={activeItem.content.content_text} />}

                                {activeItem.content.type === 'file' && (
                                    <PreviewFileViewer title={activeItem.content.title} contentUrl={activeItem.content.content_url} />
                                )}

                                {activeItem.content.type === 'ppt' && (
                                    <PreviewPptViewer title={activeItem.content.title} contentUrl={activeItem.content.content_url} />
                                )}

                                {activeItem.content.type === 'quiz' && (
                                    <CourseQuizRunner
                                        title={activeItem.content.title}
                                        duration={activeItem.content.duration}
                                        quizQuestions={activeItem.content.quiz_questions}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
