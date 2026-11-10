import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, Plus } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/atoms/Button';
import Modal from '@/components/atoms/Modal';
import InputField from '@/components/molecules/InputField';
import CourseAdd from '@/components/organisms/Course/CourseAdd';
import CourseGrid from '@/components/organisms/Course/CourseGrid';
import UserLayout from '@/components/templates/UserLayout';
import { useCourse } from '@/hooks/useCourse';
import type { Course } from '@/types';
import type { SharedPageProps } from '@/types/shared';

interface CoursePageProps extends SharedPageProps {
    courses?: Course[];
}

export default function CoursePage() {
    const { auth, courses = [] } = usePage<CoursePageProps>().props;
    const role = auth.user.role;
    const [open, setOpen] = useState(false);

    const { search, setSearch, filteredCourses } = useCourse(undefined, courses);

    return (
        <>
            <Head title={role === 'instructor' ? 'My Courses' : 'My Learning'} />

            <div className="space-y-8">
                {/* Header Banner */}
                <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
                    <div className="pointer-events-none absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
                    <div className="pointer-events-none absolute -top-10 right-20 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl" />

                    <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-purple-300">
                                {role === 'instructor' ? 'Instructor / Courses' : 'Student / Learning'}
                            </p>
                            <h1 className="text-2xl font-bold text-white sm:text-3xl">{role === 'instructor' ? 'My Courses' : 'My Learning'}</h1>
                            <p className="text-sm text-slate-400">
                                {role === 'instructor'
                                    ? 'Manage and publish courses for your students.'
                                    : 'Track your enrolled courses and progress.'}
                            </p>
                        </div>

                        {role === 'instructor' && (
                            <Button onClick={() => setOpen(true)} leftIcon={<Plus size={16} />} className="shrink-0 !rounded-none">
                                Add Course
                            </Button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-6 border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-700 dark:bg-[#1e1f24]">
                    <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center dark:border-slate-700">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                {role === 'instructor'
                                    ? `All My Courses (${filteredCourses.length})`
                                    : `Enrolled Courses (${filteredCourses.length})`}
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                {role === 'instructor' ? "Courses you've created and published." : "Courses you're currently enrolled in."}
                            </p>
                        </div>
                        {role === 'instructor' && courses.length > 0 && (
                            <div className="w-full sm:w-80">
                                <InputField
                                    label=""
                                    placeholder="Search course title..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {filteredCourses.length > 0 ? (
                        <CourseGrid courses={filteredCourses} enrolled={role === 'student'} />
                    ) : (
                        /* Empty State */
                        <div className="flex flex-col items-center gap-4 py-20 text-center">
                            <div className="flex h-14 w-14 items-center justify-center border border-slate-200 bg-slate-50 text-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-500">
                                <BookOpen size={28} strokeWidth={1.5} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                    {role === 'instructor' ? 'No courses yet' : 'No enrolled courses yet'}
                                </p>
                                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                    {role === 'instructor'
                                        ? 'Create your first course to get started.'
                                        : 'Browse the catalog and enroll in a course.'}
                                </p>
                            </div>
                            {role === 'instructor' ? (
                                <Button onClick={() => setOpen(true)} leftIcon={<Plus size={15} />} className="!rounded-none">
                                    Create Course
                                </Button>
                            ) : (
                                <Link href="/course" className="text-center">
                                    <Button variant="outline" className="!rounded-none">
                                        Browse Courses
                                    </Button>
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {role === 'instructor' && (
                <Modal open={open} onClose={() => setOpen(false)} title="Add Course">
                    <CourseAdd onSuccess={() => setOpen(false)} />
                </Modal>
            )}
        </>
    );
}

CoursePage.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>;

CoursePage.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>;
