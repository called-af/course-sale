import { usePage, Link, router } from '@inertiajs/react';
import { Eye, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Label from '@/components/atoms/Label';
import Title from '@/components/atoms/Title';
import ConfirmationDelete from '@/components/molecules/ConfirmationDelete';

import { useCourse } from '@/hooks/useCourse';
import { formatCoursePrice } from '@/lib/currency';
import type { Course } from '@/types';
import type { SharedPageProps } from '@/types/shared';

interface CourseCardProps {
    course: Course;
    /** Show owner-only management controls (preview, delete) and owner links. */
    manageable?: boolean;
    /** Marks the course as already enrolled by the viewer. */
    enrolled?: boolean;
}

export default function CourseCard({ course, manageable = true, enrolled = false }: CourseCardProps) {
    const { destroy } = useCourse();
    const [openDelete, setOpenDelete] = useState(false);

    const { auth } = usePage<SharedPageProps>().props;
    const user = auth?.user;

    const creatorId = typeof course.creator === 'object' ? course.creator?.id : course.creator_id;
    const isCourseOwner =
        manageable && user && (user.role === 'admin' || (user.role === 'instructor' && (creatorId === user.id || course.creator_id === user.id)));

    const rolePrefix = user?.role ?? 'admin';
    // All non-owner cards (including students in My Learning) go to
    // the course detail page (/course/slug) first. Enrolled students continue via Resume.
    // The owning instructor still goes to their management page.
    const courseHref = isCourseOwner ? `/${rolePrefix}/courses/${course.slug}` : `/course/${course.slug}`;

    return (
        <>
            <div
                onClick={() => router.visit(courseHref)}
                className="group flex h-full cursor-pointer flex-col border border-neutral-100 bg-white transition-shadow duration-200 hover:shadow-md dark:border-slate-800 dark:bg-[#1e1f24] dark:hover:shadow-slate-900/50"
            >
                {/* Thumbnail — clean, no overlay */}
                <div className="aspect-video w-full overflow-hidden bg-neutral-100 dark:bg-[#141416]">
                    <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-3 p-4">
                    {/* Title */}
                    <Title as="h2" className="line-clamp-2 text-sm leading-snug font-semibold text-neutral-800 dark:text-slate-100">
                        {course.title}
                    </Title>

                    {/* Creator */}
                    <Label className="text-xs text-neutral-400 dark:text-slate-500">By {course.creator?.name ?? '—'}</Label>

                    {/* Description */}
                    <Label className="line-clamp-2 text-xs leading-relaxed text-neutral-500 dark:text-slate-400">{course.description}</Label>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        {course.level && <Badge>{course.level}</Badge>}
                        <Badge variant={enrolled ? 'success' : course.type === 'free' ? 'info' : 'warning'}>
                            {enrolled ? 'Enrolled' : formatCoursePrice(course.type, course.price)}
                        </Badge>
                        <Badge variant={course.status === 'published' ? 'success' : 'default'}>{course.status}</Badge>
                    </div>

                    {!isCourseOwner && enrolled && (
                        <Link href={`/student/courses/${course.slug}`} onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" widthFull leftIcon={<PlayCircle className="h-3.5 w-3.5" />} className="!rounded-none">
                                Continue Learning
                            </Button>
                        </Link>
                    )}

                    {isCourseOwner && (
                        <div className="mt-1 space-y-2 border-t border-neutral-100 pt-3 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                            <div className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs text-neutral-400 sm:grid-cols-2 dark:text-slate-500">
                                <span>Categories</span>
                                <span className="truncate text-right font-medium text-neutral-700 dark:text-slate-200">
                                    {course.categories?.map((category) => category.name).join(', ') || '—'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <Link href={`/${rolePrefix}/courses/${course.slug}/preview`}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        widthFull
                                        leftIcon={<Eye className="h-3.5 w-3.5" />}
                                        className="!rounded-none !border-purple-200 !bg-purple-50 !text-purple-700 hover:!bg-purple-100 dark:!border-purple-900/50 dark:!bg-purple-950/40 dark:!text-purple-300 dark:hover:!bg-purple-950/60"
                                    >
                                        Preview
                                    </Button>
                                </Link>

                                <Button
                                    variant="danger"
                                    size="sm"
                                    widthFull
                                    className="!rounded-none"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenDelete(true);
                                    }}
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {manageable && (
                <ConfirmationDelete
                    open={openDelete}
                    onClose={() => setOpenDelete(false)}
                    onConfirm={() => destroy(course.slug)}
                    title="Delete Course"
                    message={`Are you sure you want to delete "${course.title}"? This action will permanently remove the course, including its modules, materials, and lesson content.`}
                />
            )}
        </>
    );
}
