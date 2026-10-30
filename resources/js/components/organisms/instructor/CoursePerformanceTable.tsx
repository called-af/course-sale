import { Link } from '@inertiajs/react';
import { ArrowRight, BookOpen, Plus, Star } from 'lucide-react';
import CourseStatusBadge from '@/components/atoms/CourseStatusBadge';
import DashboardPanel from '@/components/molecules/DashboardPanel';
import { formatRupiah } from '@/lib/dashboard';
import type { InstructorCourse } from '@/types/dashboard';

interface CoursePerformanceTableProps {
    courses: InstructorCourse[];
}

export default function CoursePerformanceTable({ courses }: CoursePerformanceTableProps) {
    return (
        <DashboardPanel
            title="Course Performance"
            description="Students, ratings, and earnings per course."
            className="overflow-hidden"
            bodyClassName="p-0"
            action={
                <Link
                    href="/instructor/courses"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 transition hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                >
                    View All <ArrowRight size={13} />
                </Link>
            }
        >
            {courses.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:bg-slate-900/60 dark:text-slate-500">
                            <tr>
                                <th className="px-5 py-3 font-bold sm:px-6">Course</th>
                                <th className="px-3 py-3 font-bold">Status</th>
                                <th className="px-3 py-3 text-right font-bold">Students</th>
                                <th className="px-3 py-3 text-right font-bold">Rating</th>
                                <th className="px-5 py-3 text-right font-bold sm:px-6">Earnings</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {courses.slice(0, 6).map((course) => {
                                const courseEarnings =
                                    course.type === 'paid' ? (course.price ?? 0) * (course.enrollments_count ?? 0) : 0;

                                return (
                                    <tr key={course.id} className="group transition hover:bg-purple-50/40 dark:hover:bg-purple-950/20">
                                        <td className="px-5 py-3 sm:px-6">
                                            <Link href={`/instructor/courses/${course.slug}`} className="flex items-center gap-3">
                                                <div className="h-9 w-14 shrink-0 overflow-hidden bg-slate-200 dark:bg-slate-700">
                                                    <img
                                                        src={course.thumbnail_url ?? '/assets/landscape.jpeg'}
                                                        alt={course.title}
                                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="line-clamp-1 font-bold text-slate-800 group-hover:text-purple-700 dark:text-slate-100 dark:group-hover:text-purple-400">
                                                        {course.title}
                                                    </p>
                                                    <p className="mt-0.5 text-[10px] capitalize text-slate-400 dark:text-slate-500">
                                                        {course.level ?? 'All level'} ·{' '}
                                                        {course.type === 'free' ? 'Free' : formatRupiah(course.price ?? 0)}
                                                    </p>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-3 py-3">
                                            <CourseStatusBadge status={course.status} />
                                        </td>
                                        <td className="px-3 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                                            {course.enrollments_count ?? 0}
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                                                <Star size={11} className="fill-amber-400 text-amber-400" />
                                                {Number(course.rating_avg ?? 0).toFixed(1)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right font-bold text-emerald-600 sm:px-6 dark:text-emerald-400">
                                            {course.type === 'paid' ? formatRupiah(courseEarnings) : 'Free'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="px-5 py-12 text-center sm:px-6">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-300">
                        <BookOpen size={20} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">You have not created any courses yet</p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Create your first course to start teaching students.</p>
                    <Link
                        href="/instructor/courses"
                        className="mt-4 inline-flex items-center gap-1.5 bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-purple-700"
                    >
                        <Plus size={14} /> Create Course
                    </Link>
                </div>
            )}
        </DashboardPanel>
    );
}
