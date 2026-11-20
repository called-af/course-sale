import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Award, CheckCircle, Eye, Image, Save, Tag } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import Button from '@/components/atoms/Button';
import Modal from '@/components/atoms/Modal';
import ChooseFile from '@/components/molecules/ChooseFile';
import InputField from '@/components/molecules/InputField';
import MultiSelectField from '@/components/molecules/MultiSelectField';
import PageHeader from '@/components/molecules/PageHeader';
import SelectField from '@/components/molecules/SelectField';
import TextAreaField from '@/components/molecules/TextAreaField';
import CourseResourcesSection from '@/components/organisms/Course/CourseResourcesSection';
import CourseStructure from '@/components/organisms/Course/CourseStructure';
import EnrolledStudentsList from '@/components/organisms/Course/EnrolledStudentsList';

import AdminLayout from '@/components/templates/AdminLayout';
import { useCourse } from '@/hooks/useCourse';
import type { Course, EnrolledStudent } from '@/types';
import type { SharedPageProps } from '@/types/shared';

interface CourseSlugProps {
    course: Course;
    categories: { id: number; name: string }[];
    tags?: { id: number; name: string }[];
    enrolled_students?: EnrolledStudent[];
}

export default function CourseSlug({ course, categories, tags, enrolled_students }: CourseSlugProps) {
    const { auth } = usePage<SharedPageProps>().props;
    const rolePrefix = auth?.user?.role ?? 'admin';
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [isApproving, setIsApproving] = useState(false);

    const { data, setData, errors, processing, preview, handleThumbnailChange, hasChanges, save } = useCourse(course);

    const approve = () => {
        router.put(
            `/admin/courses/${course.slug}/approve`,
            {},
            {
                onStart: () => setIsApproving(true),
                onSuccess: () => setIsApprovalModalOpen(false),
                onFinish: () => setIsApproving(false),
            },
        );
    };

    return (
        <>
            <Head title={`${data.title} - Admin Course`} />

            <div className="max-w-8xl mx-auto space-y-8">
                <PageHeader
                    breadcrumbs={[{ label: 'All Courses', href: `/${rolePrefix}/courses` }, { label: course.title }]}
                    title={data.title || 'Course Details'}
                    titleBadge={
                        <span
                            className={`px-3 py-1 text-xs font-bold tracking-wider uppercase ${
                                data.status === 'published'
                                    ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                                    : data.status === 'review'
                                      ? 'border border-blue-500/30 bg-blue-500/20 text-blue-300'
                                      : 'border border-amber-500/30 bg-amber-500/20 text-amber-300'
                            }`}
                        >
                            {data.status}
                        </span>
                    }
                    description={course.creator ? `Created by ${course.creator.name}` : undefined}
                    actions={
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                            {course.status === 'review' && (
                                <Button
                                    onClick={() => setIsApprovalModalOpen(true)}
                                    leftIcon={<CheckCircle className="h-4 w-4" />}
                                    className="w-full justify-center !rounded-none sm:w-auto"
                                >
                                    Approve & Publish
                                </Button>
                            )}
                            <Link
                                href={`/${rolePrefix}/courses/${course.slug}/preview`}
                                className="inline-flex w-full items-center justify-center gap-2 border border-purple-500 bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02] hover:bg-purple-500 active:scale-[0.98] sm:w-auto"
                            >
                                <Eye className="h-4 w-4" />
                                Preview
                            </Link>
                            <Link
                                href={`/${rolePrefix}/courses`}
                                className="inline-flex w-full items-center justify-center gap-2 border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-all duration-200 hover:scale-[1.02] hover:bg-white/20 active:scale-[0.98] sm:w-auto"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Link>
                        </div>
                    }
                />

                {/* 2-Column Settings Layout */}
                <div className="grid items-start gap-8 lg:grid-cols-12">
                    {/* Left Column */}
                    <div className="space-y-6 lg:col-span-5">
                        {/* Thumbnail */}
                        <div className="space-y-4 border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-[#1e1f24]">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
                                <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-800 uppercase dark:text-slate-100">
                                    <Image className="h-4 w-4 text-purple-500" />
                                    Course Thumbnail
                                </h3>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">16:9 Ratio</span>
                            </div>
                            <ChooseFile label="" aspect="video" value={preview} onChange={(file) => file && handleThumbnailChange(file)} />
                            {errors.thumbnail && <p className="text-xs font-medium text-red-500">{errors.thumbnail}</p>}
                            <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                                Use a high-resolution 16:9 ratio image for optimal catalog presentation.
                            </p>
                        </div>

                        {/* Tags */}
                        <div className="space-y-4 border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-[#1e1f24]">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
                                <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-800 uppercase dark:text-slate-100">
                                    <Tag className="h-4 w-4 text-purple-500" />
                                    Course Tags
                                </h3>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500">For Recommendations</span>
                            </div>
                            <MultiSelectField
                                label=""
                                color="purple"
                                value={data.tag_ids ?? []}
                                onChange={(values) => setData('tag_ids', values)}
                                options={(tags ?? []).map((t) => ({ label: t.name, value: t.id }))}
                            />
                            <p className="text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                                Tags help student discovery and power personalized recommendations.
                            </p>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6 border border-slate-200/80 bg-white p-4 shadow-sm sm:p-8 lg:col-span-7 dark:border-slate-700 dark:bg-[#1e1f24]">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-700">
                            <div className="min-w-0">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Course Information & Details</h2>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Manage title, description, pricing, and accessibility level.
                                </p>
                            </div>
                            {hasChanges && (
                                <span className="shrink-0 animate-pulse border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                                    Unsaved Changes
                                </span>
                            )}
                        </div>

                        <div className="space-y-4">
                            <InputField
                                label="Course Title"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="Enter course title..."
                            />
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <SelectField
                                    label="Difficulty Level"
                                    value={data.level}
                                    onChange={(e) => setData('level', e.target.value)}
                                    options={[
                                        { label: 'Beginner', value: 'beginner' },
                                        { label: 'Intermediate', value: 'intermediate' },
                                        { label: 'Advanced', value: 'advanced' },
                                    ]}
                                />
                                <SelectField
                                    label="Access Type"
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value)}
                                    options={[
                                        { label: 'Free', value: 'free' },
                                        { label: 'Paid', value: 'paid' },
                                    ]}
                                />
                                <SelectField
                                    label="Publication Status"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    options={[
                                        { label: 'Draft', value: 'draft' },
                                        { label: 'Under Review', value: 'review' },
                                    ]}
                                />
                            </div>
                            {data.type === 'paid' && (
                                <InputField
                                    label="Course Price (IDR)"
                                    type="number"
                                    value={data.price}
                                    onChange={(e) => setData('price', e.target.value)}
                                    placeholder="e.g., 150000"
                                />
                            )}
                            <TextAreaField
                                label="Full Description"
                                value={data.description}
                                onChange={(e: { target: { value: string } }) => setData('description', e.target.value)}
                                placeholder="Write course overview and syllabus description here..."
                            />
                        </div>

                        {/* Categories */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
                            <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-slate-800 uppercase dark:text-slate-100">
                                <Tag className="h-4 w-4 text-indigo-500" />
                                Course Categories
                            </h3>
                        </div>
                        <MultiSelectField
                            label=""
                            color="indigo"
                            value={data.category_ids ?? []}
                            onChange={(values) => setData('category_ids', values)}
                            options={(categories ?? []).map((c) => ({ label: c.name, value: c.id }))}
                        />

                        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                            <Button
                                onClick={save}
                                disabled={!hasChanges || processing}
                                leftIcon={<Save className="h-4 w-4" />}
                                className="w-full justify-center !rounded-none sm:w-auto"
                            >
                                {processing ? 'Saving Changes...' : 'Save Course Changes'}
                            </Button>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                {hasChanges ? 'Click save to apply changes.' : 'All changes saved.'}
                            </span>
                        </div>
                    </div>
                </div>

                <CourseStructure course={course} modules={course.modules ?? []} routePrefix="admin" />

                <CourseResourcesSection courseSlug={course.slug} resources={course.resources ?? []} routePrefix="admin" />

                {/* Enrolled Students List */}
                <EnrolledStudentsList students={enrolled_students ?? []} exportUrl={`/admin/courses/${course.slug}/students/export`} />

                {/* Certificate Template */}
                <div className="space-y-4 border border-slate-200/80 bg-white p-4 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-[#1e1f24]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center bg-purple-50 dark:bg-purple-950/40">
                                <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-900 dark:text-white">Certificate Template</h2>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Design the certificate (upload background, drag and position text Canva-style) on the dedicated admin page.
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/admin/certificate-template"
                            className="inline-flex items-center justify-center gap-2 border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 transition-colors hover:bg-purple-100 dark:border-purple-900/50 dark:bg-purple-950/30 dark:text-purple-300 dark:hover:bg-purple-950/50"
                        >
                            <Award className="h-4 w-4" />
                            Open Global Certificate Template
                        </Link>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        The certificate template is global (applies to all courses) and managed from the Certificate menu. Instructors can only change
                        their signature name per course.
                    </p>
                </div>
            </div>

            <Modal
                open={isApprovalModalOpen}
                onClose={() => !isApproving && setIsApprovalModalOpen(false)}
                title="Approve Course"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setIsApprovalModalOpen(false)} disabled={isApproving}>
                            Cancel
                        </Button>
                        <Button onClick={approve} isLoading={isApproving} leftIcon={<CheckCircle className="h-4 w-4" />}>
                            Approve & Publish
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-gray-700 dark:text-slate-200">Are you sure you want to approve this course?</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                    Once approved, “{course.title}” will be published and become visible in the public course catalog.
                </p>
            </Modal>
        </>
    );
}

CourseSlug.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
