import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, FileText } from 'lucide-react';
import type { ReactNode } from 'react';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import EditMaterialContent from '@/components/organisms/Course/EditMaterialContent';
import UserLayout from '@/components/templates/UserLayout';
import type { Material, MaterialContent } from '@/types';
import type { Module } from '@/types/modules';
import type { SharedPageProps } from '@/types/shared';

interface MaterialDetail extends Material {
    contents: MaterialContent[];
    module: Module & { course: { slug: string; title: string } };
}

interface MaterialPageProps {
    material: MaterialDetail;
    editContentId?: number | null;
}

export default function MaterialPage({ material, editContentId = null }: MaterialPageProps) {
    const { auth } = usePage<SharedPageProps>().props;
    const rolePrefix = auth?.user?.role ?? 'instructor';

    const content = material.contents?.find((c) => c.id === editContentId);

    const course = material.module?.course;
    const module = material.module;

    if (!content) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center space-y-3 rounded-none border border-slate-200 bg-white p-8 text-center shadow-xs dark:border-slate-700 dark:bg-[#1e1f24]">
                <div className="flex h-12 w-12 items-center justify-center bg-amber-50 text-amber-500 dark:bg-amber-950/40">
                    <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Content Not Found</h3>
                <p className="max-w-md text-xs text-slate-500 dark:text-slate-400">The requested content is unavailable or may have been deleted.</p>
                <Link href={`/${rolePrefix}/courses/${course?.slug || ''}`}>
                    <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} className="!rounded-none">
                        Back to Course Structure
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <>
            <Head title={`Edit ${content.title} - ${course?.title || 'Material'}`} />

            <div className="max-w-8xl mx-auto space-y-6">
                {/* Header Banner matching all other course pages */}
                <div className="relative overflow-hidden rounded-none bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
                    <div className="pointer-events-none absolute -right-10 -bottom-10 h-64 w-64 bg-purple-500/10 blur-3xl" />
                    <div className="pointer-events-none absolute -top-10 right-20 h-48 w-48 bg-indigo-500/10 blur-2xl" />

                    <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                        <div className="space-y-3">
                            {/* Breadcrumb Navigation */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <Link
                                    href={`/${rolePrefix}/courses`}
                                    className="inline-flex items-center gap-1.5 text-slate-300 transition-colors hover:text-white"
                                >
                                    <span className="font-medium">All Courses</span>
                                </Link>

                                <span className="text-slate-500">/</span>

                                <Link
                                    href={`/${rolePrefix}/courses/${course.slug}`}
                                    className="inline-flex items-center gap-1.5 text-slate-300 transition-colors hover:text-white"
                                >
                                    <span className="max-w-[150px] truncate font-medium">{course.title}</span>
                                </Link>

                                <span className="text-slate-500">/</span>

                                <span className="max-w-[150px] truncate font-medium text-slate-300">{module.title}</span>

                                <span className="text-slate-500">/</span>

                                <div className="inline-flex items-center gap-1.5 font-semibold text-purple-200">
                                    <span className="max-w-[150px] truncate">{material.title}</span>
                                </div>
                            </div>

                            {/* Title & Type Badge */}
                            <div>
                                <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                    <span>Edit Material Content</span>
                                    <Badge variant="purple" className="!rounded-none">
                                        {content.type}
                                    </Badge>
                                </h1>
                                <p className="mt-1 max-w-2xl text-xs font-medium text-slate-300 sm:text-sm">{content.title}</p>
                            </div>
                        </div>

                        {/* Header Action Button */}
                        <div className="flex-shrink-0">
                            <Link href={`/${rolePrefix}/courses/${course.slug}`}>
                                <Button variant="outline" size="md" leftIcon={<ArrowLeft className="h-4 w-4" />} className="!rounded-none">
                                    Back to Course Structure
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Content Editor Organism */}
                <EditMaterialContent courseSlug={course.slug} moduleId={material.module_id} materialId={material.id} content={content} />
            </div>
        </>
    );
}

function MaterialPageLayout({ children }: { children: React.ReactNode }) {
    return <UserLayout>{children}</UserLayout>;
}

MaterialPage.layout = (page: ReactNode) => <MaterialPageLayout>{page}</MaterialPageLayout>;
