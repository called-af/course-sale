import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, FileText } from 'lucide-react';
import type { ReactNode } from 'react';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import PageHeader from '@/components/molecules/PageHeader';
import EditMaterialContent from '@/components/organisms/Course/EditMaterialContent';
import AdminLayout from '@/components/templates/AdminLayout';
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
    const rolePrefix = auth?.user?.role ?? 'admin';

    const content = material.contents?.find((c) => c.id === editContentId);
    const course = material.module?.course;
    const module = material.module;

    if (!content) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center space-y-3 border border-slate-200 bg-white p-8 text-center shadow-xs dark:border-slate-700 dark:bg-[#1e1f24]">
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
                <PageHeader
                    breadcrumbs={[
                        { label: 'All Courses', href: `/${rolePrefix}/courses` },
                        { label: course.title, href: `/${rolePrefix}/courses/${course.slug}` },
                        { label: module.title },
                        { label: material.title },
                    ]}
                    title="Edit Material Content"
                    description={content.title}
                    titleBadge={
                        <Badge variant="purple" className="!rounded-none">
                            {content.type}
                        </Badge>
                    }
                    actions={
                        <Link href={`/${rolePrefix}/courses/${course.slug}`}>
                            <Button variant="outline" size="md" leftIcon={<ArrowLeft className="h-4 w-4" />} className="!rounded-none">
                                Back to Course
                            </Button>
                        </Link>
                    }
                />

                <EditMaterialContent
                    courseSlug={course.slug}
                    moduleId={material.module_id}
                    materialId={material.id}
                    content={content}
                    routePrefix="admin"
                />
            </div>
        </>
    );
}

MaterialPage.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
