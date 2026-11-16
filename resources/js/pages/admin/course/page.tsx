import { Head, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/atoms/Button';
import Modal from '@/components/atoms/Modal';

import InputField from '@/components/molecules/InputField';
import PageHeader from '@/components/molecules/PageHeader';
import CourseAdd from '@/components/organisms/Course/CourseAdd';
import CourseGrid from '@/components/organisms/Course/CourseGrid';
import AdminLayout from '@/components/templates/AdminLayout';

import { useCourse } from '@/hooks/useCourse';
import type { Course } from '@/types';
import type { SharedPageProps } from '@/types/shared';

interface Paginator<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
}

interface CoursePageProps extends SharedPageProps {
    courses?: Paginator<Course>;
}

export default function Course() {
    const [open, setOpen] = useState(false);

    const { courses } = usePage<CoursePageProps>().props;
    const coursePaginator = courses ?? { data: [], current_page: 1, last_page: 1, total: 0 };
    const courseItems = coursePaginator.data ?? [];

    const { search, setSearch, filteredCourses } = useCourse(undefined, courseItems);

    const changePage = (page: number) => {
        router.get(
            '/admin/courses',
            { page },
            {
                only: ['courses'],
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <>
            <Head title="Courses - Admin" />

            <div className="max-w-8xl mx-auto space-y-8">
                <PageHeader
                    breadcrumbs={[{ label: 'Admin' }, { label: 'Courses' }]}
                    title="Courses Management"
                    description="Manage all courses available on the platform"
                    actions={
                        <Button
                            variant="primary"
                            onClick={() => setOpen(true)}
                            leftIcon={<Plus className="h-4 w-4" />}
                            className="w-full justify-center !rounded-none sm:w-auto"
                        >
                            Add Course
                        </Button>
                    }
                />

                {/* Content Card */}
                <div className="space-y-6 border border-slate-200/80 bg-white p-4 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-[#1e1f24]">
                    <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center dark:border-slate-700">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">All Courses ({coursePaginator.total})</h2>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Filter or search through all active courses.</p>
                        </div>
                        <div className="w-full sm:w-80">
                            <InputField
                                label=""
                                placeholder="Search title or instructor..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <CourseGrid courses={filteredCourses} />

                    {coursePaginator.last_page > 1 && (
                        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Showing {courseItems.length === 0 ? 0 : (coursePaginator.current_page - 1) * 10 + 1}–
                                {Math.min(coursePaginator.current_page * 10, coursePaginator.total)} of {coursePaginator.total} courses
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={coursePaginator.current_page === 1}
                                    onClick={() => changePage(coursePaginator.current_page - 1)}
                                    leftIcon={<ChevronLeft className="h-4 w-4" />}
                                    className="flex-1 justify-center sm:flex-none"
                                >
                                    Previous
                                </Button>
                                <span className="px-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Page {coursePaginator.current_page} of {coursePaginator.last_page}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={coursePaginator.current_page === coursePaginator.last_page}
                                    onClick={() => changePage(coursePaginator.current_page + 1)}
                                    rightIcon={<ChevronRight className="h-4 w-4" />}
                                    className="flex-1 justify-center sm:flex-none"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Modal open={open} onClose={() => setOpen(false)} title="Add Course">
                <CourseAdd onSuccess={() => setOpen(false)} />
            </Modal>
        </>
    );
}

Course.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
