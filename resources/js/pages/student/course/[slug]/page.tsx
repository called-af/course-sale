import UserLayout from '@/components/templates/UserLayout';
import Button from '@/components/atoms/Button';
import InputField from '@/components/molecules/InputField';
import TextAreaField from '@/components/molecules/TextAreaField';
import SelectField from '@/components/molecules/SelectField';
import MultiSelectField from '@/components/molecules/MultiSelectField';
import ChooseFile from '@/components/molecules/ChooseFile';
import PageHeader from '@/components/molecules/PageHeader';
import CourseStructure from '@/components/organisms/Course/CourseStructure';
import CertificateTemplateEditor from '@/components/organisms/Course/CertificateTemplateEditor';
import EnrolledStudentsList from '@/components/organisms/Course/EnrolledStudentsList';

import { Course, EnrolledStudent } from '@/types';
import { useCourse } from '@/hooks/useCourse';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Award, ClipboardCheck, Eye, Image, Save, Tag } from 'lucide-react';
import { useState } from 'react';

interface CourseSlugProps {
    course: Course;
    categories: { id: number; name: string }[];
    tags?: { id: number; name: string }[];
    enrolled_students?: EnrolledStudent[];
}

export default function CourseSlug({ course, categories, tags, enrolled_students }: CourseSlugProps) {
    const { auth } = usePage().props as any;
    const rolePrefix = auth?.user?.role ?? 'instructor';
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const { data, setData, errors, processing, preview, handleThumbnailChange, hasChanges, save } = useCourse(course);

    const submitForReview = () => {
        router.put(
            `/instructor/courses/${course.slug}/submit-review`,
            {},
            {
                onStart: () => setIsSubmittingReview(true),
                onFinish: () => setIsSubmittingReview(false),
            },
        );
    };

    return (
        <>
            <Head title={`${data.title} - My Course`} />

            <div className="max-w-8xl mx-auto space-y-8">
                <PageHeader
                    breadcrumbs={[{ label: 'My Courses', href: `/${rolePrefix}/courses` }, { label: course.title }]}
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
                        <div className="flex items-center gap-3">
                            {course.status === 'draft' && (
                                <Button
                                    onClick={submitForReview}
                                    disabled={hasChanges || isSubmittingReview}
                                    isLoading={isSubmittingReview}
                                    leftIcon={<ClipboardCheck className="h-4 w-4" />}
                                    title={
                                        hasChanges
                                            ? 'Save your changes before submitting the course for review.'
                                            : 'Submit this course for admin review'
                                    }
                                    className="!rounded-none"
                                >
                                    Submit for Review
                                </Button>
                            )}
                            {course.status === 'review' && (
                                <span className="border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                                    Awaiting Admin Approval
                                </span>
                            )}
                            <Link
                                href={`/${rolePrefix}/courses/${course.slug}/preview`}
                                className="inline-flex items-center gap-2 border border-purple-500 bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02] hover:bg-purple-500 active:scale-[0.98]"
                            >
                                <Eye className="h-4 w-4" />
                                Preview
                            </Link>
                            <Link
                                href={`/${rolePrefix}/courses`}
                                className="inline-flex items-center gap-2 border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-all duration-200 hover:scale-[1.02] hover:bg-white/20 active:scale-[0.98]"
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
                        <div className="space-y-4 border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1e1f24]">
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
                        <div className="space-y-4 border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1e1f24]">
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
                    <div className="space-y-6 border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 lg:col-span-7 dark:border-slate-700 dark:bg-[#1e1f24]">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-700">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Course Information & Details</h2>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Manage title, description, pricing, and accessibility level.
                                </p>
                            </div>
                            {hasChanges && (
                                <span className="animate-pulse border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
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

                        <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-700">
                            <Button
                                onClick={save}
                                disabled={!hasChanges || processing}
                                leftIcon={<Save className="h-4 w-4" />}
                                className="!rounded-none"
                            >
                                {processing ? 'Saving Changes...' : 'Save Course Changes'}
                            </Button>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                {hasChanges ? 'Click save to apply changes.' : 'All changes saved.'}
                            </span>
                        </div>
                    </div>
                </div>

                <CourseStructure course={course} modules={course.modules ?? []} routePrefix="instructor" />

                {/* Enrolled Students List */}
                <EnrolledStudentsList students={enrolled_students ?? []} />

                {/* Certificate Template Editor */}
                <div className="space-y-6 border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-[#1e1f24]">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-700">
                        <div className="flex h-8 w-8 items-center justify-center bg-purple-50 dark:bg-purple-950/40">
                            <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Certificate Template</h2>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Customize the certificate design issued to students who complete this course.
                            </p>
                        </div>
                    </div>
                    <CertificateTemplateEditor
                        courseSlug={course.slug}
                        rolePrefix="instructor"
                        initialTemplate={{
                            primary_color: course.certificate_template?.primary_color ?? '#7c3aed',
                            accent_color: course.certificate_template?.accent_color ?? '#a78bfa',
                            bg_style: (course.certificate_template?.bg_style ?? 'dark') as 'dark' | 'light' | 'gradient',
                            show_signature: course.certificate_template?.show_signature ?? false,
                            signature_name: course.certificate_template?.signature_name ?? '',
                            custom_title: course.certificate_template?.custom_title ?? '',
                            footer_note: course.certificate_template?.footer_note ?? '',
                        }}
                    />
                </div>
            </div>
        </>
    );
}

CourseSlug.layout = (page: any) => <UserLayout>{page}</UserLayout>;
