import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Title from '@/components/atoms/Title';
import Label from '@/components/atoms/Label';
import ConfirmationDelete from '@/components/molecules/ConfirmationDelete';

import { useState } from 'react';
import { Course } from '@/types';
import { useCourse } from '@/hooks/useCourse';
import { usePage, Link, router } from '@inertiajs/react';
import { Eye } from 'lucide-react';

interface CourseCardProps {
    course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
    const { destroy } = useCourse();
    const [openDelete, setOpenDelete] = useState(false);

    const { auth } = usePage().props as any;
    const user = auth?.user;

    const creatorId = typeof course.creator === 'object' ? (course.creator as any)?.id : ((course as any).creator_id ?? course.creator);
    const isCourseOwner =
        user && (user.role === 'admin' || (user.role === 'instructor' && (creatorId === user.id || (course as any).creator_id === user.id)));

    const rolePrefix = user?.role ?? 'admin';
    // All non-owner cards (including students in My Learning) go to
    // the course detail page (/course/slug) first. Enrolled students continue via Resume.
    // The owning instructor still goes to their management page.
    const courseHref = isCourseOwner
        ? `/${rolePrefix}/courses/${course.slug}`
        : `/course/${course.slug}`;

    return (
        <>
            <div
                onClick={() => router.visit(courseHref)}
                className="group cursor-pointer border border-neutral-100 bg-white transition-shadow duration-200 hover:shadow-md"
            >
                {/* Thumbnail — clean, no overlay */}
                <div className="aspect-video w-full overflow-hidden bg-neutral-100">
                    <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </div>

                {/* Content */}
                <div className="space-y-3 p-4">
                    {/* Title */}
                    <Title as="h2" className="line-clamp-2 text-sm leading-snug font-semibold text-neutral-800">
                        {course.title}
                    </Title>

                    {/* Creator */}
                    <Label className="text-xs text-neutral-400">By {course.creator?.name ?? '—'}</Label>

                    {/* Description */}
                    <Label className="line-clamp-2 text-xs leading-relaxed text-neutral-500">{course.description}</Label>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        {course.level && <Badge>{course.level}</Badge>}
                        <Badge variant={course.type === 'free' ? 'info' : 'warning'}>
                            {course.type === 'free' ? 'FREE' : `Rp ${course.price?.toLocaleString('id-ID')}`}
                        </Badge>
                        <Badge variant={course.status === 'published' ? 'success' : 'default'}>{course.status}</Badge>
                    </div>

                    {isCourseOwner && (
                        <div className="mt-1 space-y-2 border-t border-neutral-100 pt-3" onClick={(e) => e.stopPropagation()}>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-neutral-400">
                                <span>Categories</span>
                                <span className="truncate text-right font-medium text-neutral-700">
                                    {course.categories?.map((category) => category.name).join(', ') || '—'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <Link
                                    href={`/${rolePrefix}/courses/${course.slug}/preview`}
                                    className="inline-flex items-center justify-center gap-1 border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100"
                                >
                                    <Eye className="h-3.5 w-3.5" /> Preview
                                </Link>

                                <Button
                                    variant="danger"
                                    className="w-full !rounded-none py-1.5 text-xs"
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

            <ConfirmationDelete
                open={openDelete}
                onClose={() => setOpenDelete(false)}
                onConfirm={() => destroy(course.slug)}
                title="Delete Course"
                message={`Are you sure you want to delete "${course.title}"? This action will permanently remove the course, including its modules, materials, and lesson content.`}
            />
        </>
    );
}
