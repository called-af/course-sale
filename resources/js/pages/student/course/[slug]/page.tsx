import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Award, ClipboardCheck, Eye, Image, ImagePlus, PenLine, Save, Tag, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import Button from '@/components/atoms/Button';
import ChooseFile from '@/components/molecules/ChooseFile';
import InputField from '@/components/molecules/InputField';
import MultiSelectField from '@/components/molecules/MultiSelectField';
import PageHeader from '@/components/molecules/PageHeader';
import SelectField from '@/components/molecules/SelectField';
import TextAreaField from '@/components/molecules/TextAreaField';
import CourseResourcesSection from '@/components/organisms/Course/CourseResourcesSection';
import CourseStructure from '@/components/organisms/Course/CourseStructure';
import EnrolledStudentsList from '@/components/organisms/Course/EnrolledStudentsList';

import UserLayout from '@/components/templates/UserLayout';
import { useCourse } from '@/hooks/useCourse';
import { validateTransparentPng } from '@/lib/transparent-png';
import type { Course, EnrolledStudent, EnrolledStudentsSummary, Paginator } from '@/types';
import type { SharedPageProps } from '@/types/shared';

interface CourseSlugProps {
    course: Course;
    categories: { id: number; name: string }[];
    tags?: { id: number; name: string }[];
    enrolled_students?: Paginator<EnrolledStudent>;
    enrolled_students_summary?: EnrolledStudentsSummary;
}

export default function CourseSlug({ course, categories, tags, enrolled_students, enrolled_students_summary }: CourseSlugProps) {
    const { auth } = usePage<SharedPageProps>().props;
    const rolePrefix = auth?.user?.role ?? 'instructor';
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const { data, setData, errors, processing, preview, handleThumbnailChange, hasChanges, save } = useCourse(course);

    const [signatureName, setSignatureName] = useState<string>(course.certificate_template?.signature_name ?? '');
    const [savingSignature, setSavingSignature] = useState(false);
    const [signatureFile, setSignatureFile] = useState<File | null>(null);
    const [removeSignature, setRemoveSignature] = useState(false);
    const [signatureError, setSignatureError] = useState<string | null>(null);
    const signatureFileInputRef = useRef<HTMLInputElement>(null);

    const signaturePreviewUrl = useMemo(() => (signatureFile ? URL.createObjectURL(signatureFile) : null), [signatureFile]);
    const storedSignatureUrl = course.certificate_template?.signature_image_url ?? null;
    const activeSignatureUrl = removeSignature ? null : signaturePreviewUrl || storedSignatureUrl;

    useEffect(
        () => () => {
            if (signaturePreviewUrl) URL.revokeObjectURL(signaturePreviewUrl);
        },
        [signaturePreviewUrl],
    );

    const pickSignature = async (file: File | null) => {
        if (!file) return;

        const error = await validateTransparentPng(file);
        setSignatureError(error);
        if (error) return;

        setSignatureFile(file);
        setRemoveSignature(false);
    };

    const saveSignature = () => {
        const data = new FormData();
        data.append('_method', 'PUT');
        data.append('signature_name', signatureName);
        if (removeSignature) data.append('remove_signature_image', '1');
        if (signatureFile) data.append('signature_image', signatureFile);

        router.post(`/instructor/courses/${course.slug}/certificate-template/signature`, data, {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => {
                setSavingSignature(true);
                setSignatureError(null);
            },
            onFinish: () => setSavingSignature(false),
            onSuccess: () => {
                setSignatureFile(null);
                setRemoveSignature(false);
            },
            onError: (formErrors) => setSignatureError(formErrors.signature_image ?? null),
        });
    };

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
                            <Link href={`/${rolePrefix}/courses/${course.slug}/preview`}>
                                <Button leftIcon={<Eye className="h-4 w-4" />} className="!rounded-none">
                                    Preview
                                </Button>
                            </Link>
                            <Link href={`/${rolePrefix}/courses`}>
                                <Button
                                    variant="outline"
                                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                                    className="!rounded-none !border-white/15 !bg-white/10 !text-white backdrop-blur-md hover:!bg-white/20"
                                >
                                    Back
                                </Button>
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

                <CourseResourcesSection courseSlug={course.slug} resources={course.resources ?? []} routePrefix="instructor" />

                {/* Enrolled Students List */}
                <EnrolledStudentsList
                    students={enrolled_students}
                    summary={enrolled_students_summary}
                    exportUrl={`/instructor/courses/${course.slug}/students/export`}
                />

                {/* Certificate Signature (instructor-limited) */}
                <div className="space-y-4 border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-[#1e1f24]">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-700">
                        <div className="flex h-8 w-8 items-center justify-center bg-purple-50 dark:bg-purple-950/40">
                            <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Certificate Signature</h2>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Change your signature name and upload your own transparent PNG. The template layout and design are managed by the
                                admin.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
                        <div className="space-y-3">
                            <InputField
                                label="Signature Name"
                                value={signatureName}
                                onChange={(e) => setSignatureName(e.target.value)}
                                placeholder="e.g. Instructor Name"
                            />

                            <div>
                                <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Signature image</span>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => signatureFileInputRef.current?.click()}
                                        className="inline-flex items-center gap-1.5 border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300"
                                    >
                                        <ImagePlus className="h-4 w-4" />
                                        {activeSignatureUrl ? 'Replace PNG' : 'Upload PNG'}
                                    </button>
                                    {activeSignatureUrl && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSignatureFile(null);
                                                setRemoveSignature(true);
                                                setSignatureError(null);
                                            }}
                                            className="inline-flex items-center gap-1.5 border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                                        >
                                            <Trash2 className="h-4 w-4" /> Remove
                                        </button>
                                    )}
                                </div>
                                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                                    Transparent PNG only · no background · max 2 MB. Removing your image falls back to the admin default.
                                </p>
                                {signatureError && (
                                    <p className="mt-1.5 text-[11px] leading-relaxed text-red-600 dark:text-red-400">{signatureError}</p>
                                )}
                                <input
                                    ref={signatureFileInputRef}
                                    type="file"
                                    accept="image/png"
                                    className="hidden"
                                    onChange={(event) => {
                                        pickSignature(event.target.files?.[0] ?? null);
                                        event.target.value = '';
                                    }}
                                />
                            </div>
                        </div>

                        <div
                            className="flex h-40 items-center justify-center overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                            style={{
                                backgroundImage: 'conic-gradient(#e5e7eb 0 25%, #ffffff 0 50%, #e5e7eb 0 75%, #ffffff 0)',
                                backgroundSize: '14px 14px',
                            }}
                        >
                            {activeSignatureUrl ? (
                                <img src={activeSignatureUrl} alt="Signature preview" className="h-full w-full object-contain" />
                            ) : (
                                <div className="flex flex-col items-center gap-1 text-slate-400 dark:text-slate-500">
                                    <PenLine className="h-6 w-6" />
                                    <span className="text-[11px] font-medium">No signature image</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={saveSignature}
                            isLoading={savingSignature}
                            leftIcon={<PenLine className="h-4 w-4" />}
                            className="!rounded-none"
                        >
                            Save Signature
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

CourseSlug.layout = (page: ReactNode) => <UserLayout>{page}</UserLayout>;
