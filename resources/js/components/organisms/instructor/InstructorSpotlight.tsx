import { Link } from '@inertiajs/react';
import { ArrowRight, BookOpen, Plus, Star, TrendingUp, Users, Wallet } from 'lucide-react';
import Button from '@/components/atoms/Button';
import WeeklyPulse from '@/components/molecules/WeeklyPulse';
import { formatCoursePrice } from '@/lib/currency';
import type { InstructorCourse } from '@/types/dashboard';

interface InstructorSpotlightProps {
    topCourse: InstructorCourse | null;
    weeklyEnrollments: number;
    totalLessons: number;
    completionRate: number;
    totalCertificates: number;
}

export default function InstructorSpotlight({
    topCourse,
    weeklyEnrollments,
    totalLessons,
    completionRate,
    totalCertificates,
}: InstructorSpotlightProps) {
    return (
        <div className="grid gap-6 lg:grid-cols-3">
            {topCourse ? (
                <div className="relative overflow-hidden bg-[#141416] p-5 text-white shadow-lg lg:col-span-2">
                    <div className="pointer-events-none absolute -right-10 -bottom-10 h-48 w-48 bg-purple-500/20 blur-3xl" />
                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="aspect-video w-full shrink-0 overflow-hidden bg-slate-800 sm:w-40">
                            <img
                                src={topCourse.thumbnail_url ?? '/assets/landscape.jpeg'}
                                alt={topCourse.title}
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-200">
                                    <TrendingUp size={10} />
                                    {(topCourse.enrollments_count ?? 0) > 0 ? 'Top Performing' : 'Featured Course'}
                                </span>
                                <span className="inline-flex items-center border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-200 capitalize">
                                    {topCourse.status === 'review' ? 'In Review' : topCourse.status}
                                </span>
                            </div>
                            <h2 className="mt-2 line-clamp-2 text-lg font-bold">{topCourse.title}</h2>
                            <p className="mt-1 text-xs text-slate-400 capitalize">
                                {topCourse.level ?? 'All level'} · {topCourse.type === 'free' ? 'Free course' : 'Paid course'}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                                <span className="inline-flex items-center gap-1">
                                    <Users size={12} className="text-purple-300" />
                                    {topCourse.enrollments_count ?? 0} students
                                </span>
                                <span className="inline-flex items-center gap-1 text-amber-300">
                                    <Star size={12} className="fill-amber-300 text-amber-300" />
                                    {Number(topCourse.rating_avg ?? 0).toFixed(1)}
                                </span>
                                <span className="inline-flex items-center gap-1 text-emerald-300">
                                    <Wallet size={12} />
                                    {formatCoursePrice(topCourse.type, (topCourse.price ?? 0) * (topCourse.enrollments_count ?? 0))}
                                </span>
                            </div>
                        </div>
                        <Link href={`/instructor/courses/${topCourse.slug}`} className="w-full shrink-0 sm:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                widthFull
                                rightIcon={<ArrowRight size={13} />}
                                className="!rounded-none !border-white/20 !bg-white !text-slate-900 hover:!bg-purple-50 dark:!border-white/20 dark:!bg-white dark:!text-slate-900 dark:hover:!bg-purple-50"
                            >
                                Manage
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 bg-white p-8 text-center lg:col-span-2 dark:border-slate-700 dark:bg-[#1e1f24]">
                    <BookOpen size={22} className="text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">No course to spotlight yet</p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Create a course to see its performance here.</p>
                    <Link href="/instructor/courses" className="mt-4">
                        <Button size="sm" leftIcon={<Plus size={14} />} className="!rounded-none">
                            Create Course
                        </Button>
                    </Link>
                </div>
            )}

            <WeeklyPulse
                weeklyEnrollments={weeklyEnrollments}
                totalLessons={totalLessons}
                completionRate={completionRate}
                totalCertificates={totalCertificates}
            />
        </div>
    );
}
