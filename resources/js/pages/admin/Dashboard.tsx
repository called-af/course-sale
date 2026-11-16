import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, DollarSign, GraduationCap, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import PageHeader from '@/components/molecules/PageHeader';
import AdminLayout from '@/components/templates/AdminLayout';
import { formatRupiah } from '@/lib/currency';
import type { SharedPageProps } from '@/types/shared';

interface AdminMetrics {
    totalUsers?: number;
    totalCourses?: number;
    activeEnrollments?: number;
    revenue?: number;
}

interface AdminTopCourse {
    id: number;
    title: string;
    slug: string;
    enrollments_count: number;
}

interface AdminRecentEnrollment {
    id: number;
    enrolled_at?: string;
    user?: { name?: string };
    course?: { title?: string };
}

interface AdminRecentCourse {
    id: number;
    title: string;
    slug: string;
    status: string;
    created_at?: string;
}

interface AdminDashboardProps extends SharedPageProps {
    metrics?: AdminMetrics;
    topCourses?: AdminTopCourse[];
    recentEnrollments?: AdminRecentEnrollment[];
    recentCourses?: AdminRecentCourse[];
}

export default function Dashboard() {
    const { auth, metrics = {}, topCourses = [], recentEnrollments = [], recentCourses = [] } = usePage<AdminDashboardProps>().props;
    return (
        <>
            <Head title="Admin Dashboard" />
            <div className="max-w-8xl mx-auto space-y-6 sm:space-y-8">
                <PageHeader
                    breadcrumbs={[{ label: 'Admin' }, { label: 'Dashboard' }]}
                    title={`Welcome back, ${auth.user.name}`}
                    description="Monitor your platform's latest performance and activity."
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
                    <Kpi title="Total Users" value={metrics.totalUsers ?? 0} icon={<Users size={18} />} />
                    <Kpi title="Total Courses" value={metrics.totalCourses ?? 0} icon={<BookOpen size={18} />} />
                    <Kpi title="Active Enrollments" value={metrics.activeEnrollments ?? 0} icon={<GraduationCap size={18} />} />
                    <Kpi title="Paid Revenue" value={formatRupiah(metrics.revenue ?? 0)} icon={<DollarSign size={18} />} compact />
                </div>
                <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
                    <Panel title="Top Courses" className="xl:col-span-2">
                        {topCourses.length ? (
                            topCourses.map((course) => (
                                <Link
                                    key={course.id}
                                    href={`/admin/courses/${course.slug}`}
                                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-slate-100 py-3 text-slate-700 last:border-0 hover:text-purple-700 dark:border-slate-700 dark:text-slate-200 dark:hover:text-purple-400"
                                >
                                    <p className="min-w-0 flex-1 truncate font-medium">{course.title}</p>
                                    <span className="shrink-0 text-xs font-semibold text-purple-700 sm:text-sm dark:text-purple-400">
                                        {course.enrollments_count} students
                                    </span>
                                </Link>
                            ))
                        ) : (
                            <Empty text="No course data yet." />
                        )}
                    </Panel>
                    <Panel title="Recent Enrollments">
                        {recentEnrollments.length ? (
                            recentEnrollments.map((item) => (
                                <div key={item.id} className="border-b border-slate-100 py-3 last:border-0 dark:border-slate-700">
                                    <p className="truncate font-medium text-slate-700 dark:text-slate-200">{item.user?.name ?? 'Student'}</p>
                                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-400 dark:text-slate-500">
                                        {item.course?.title ?? 'Course'} · {date(item.enrolled_at)}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <Empty text="No enrollment yet." />
                        )}
                    </Panel>
                </div>
                <Panel title="Recent Courses">
                    {recentCourses.length ? (
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                            {recentCourses.map((course) => (
                                <Link
                                    key={course.id}
                                    href={`/admin/courses/${course.slug}`}
                                    className="border border-slate-200 bg-white p-4 transition hover:border-purple-300 dark:border-slate-700 dark:bg-[#1e1f24] dark:hover:border-purple-600"
                                >
                                    <p className="line-clamp-2 font-medium text-slate-700 dark:text-slate-200">{course.title}</p>
                                    <p className="mt-2 text-xs text-slate-400 capitalize dark:text-slate-500">
                                        {course.status} · {date(course.created_at)}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <Empty text="No courses yet." />
                    )}
                </Panel>
            </div>
        </>
    );
}

interface KpiProps {
    title: string;
    value: ReactNode;
    icon: ReactNode;
    compact?: boolean;
}

function Kpi({ title, value, icon, compact = false }: KpiProps) {
    return (
        <div className="min-w-0 border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:bg-[#1e1f24]">
            <div className="flex items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="min-w-0 truncate">{title}</span>
                <span className="shrink-0 bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">{icon}</span>
            </div>
            <p className={`mt-3 font-bold break-words text-slate-800 dark:text-white ${compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'}`}>
                {value}
            </p>
        </div>
    );
}

interface PanelProps {
    title: string;
    children: ReactNode;
    className?: string;
}

function Panel({ title, children, className = '' }: PanelProps) {
    return (
        <section className={`border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-[#1e1f24] ${className}`}>
            <div className="mb-4 border-b border-slate-100 pb-4 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            </div>
            {children}
        </section>
    );
}

function Empty({ text }: { text: string }) {
    return <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">{text}</p>;
}

function date(value?: string) {
    return value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value)) : 'Recently';
}

Dashboard.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
