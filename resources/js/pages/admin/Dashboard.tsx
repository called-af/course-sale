import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/components/templates/AdminLayout';
import PageHeader from '@/components/molecules/PageHeader';
import { BookOpen, DollarSign, GraduationCap, Users } from 'lucide-react';

export default function Dashboard() {
    const { auth, metrics = {}, topCourses = [], recentEnrollments = [], recentCourses = [] } = usePage().props as any;
    return (
        <>
            <Head title="Admin Dashboard" />
            <div className="max-w-8xl mx-auto space-y-8">
                <PageHeader
                    breadcrumbs={[{ label: 'Admin' }, { label: 'Dashboard' }]}
                    title={`Welcome back, ${auth.user.name}`}
                    description="Monitor your platform's latest performance and activity."
                />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                    <Kpi title="Total Users" value={metrics.totalUsers ?? 0} icon={<Users size={18} />} />
                    <Kpi title="Total Courses" value={metrics.totalCourses ?? 0} icon={<BookOpen size={18} />} />
                    <Kpi title="Active Enrollments" value={metrics.activeEnrollments ?? 0} icon={<GraduationCap size={18} />} />
                    <Kpi title="Paid Revenue" value={rupiah(metrics.revenue ?? 0)} icon={<DollarSign size={18} />} compact />
                </div>
                <div className="grid gap-6 xl:grid-cols-3">
                    <Panel title="Top Courses" className="xl:col-span-2">
                        {topCourses.length ? (
                            topCourses.map((course: any) => (
                                <Link
                                    key={course.id}
                                    href={`/admin/courses/${course.slug}`}
                                    className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0 hover:text-purple-700"
                                >
                                    <p className="font-medium text-slate-700">{course.title}</p>
                                    <span className="text-sm font-semibold text-purple-700">{course.enrollments_count} students</span>
                                </Link>
                            ))
                        ) : (
                            <Empty text="No course data yet." />
                        )}
                    </Panel>
                    <Panel title="Recent Enrollments">
                        {recentEnrollments.length ? (
                            recentEnrollments.map((item: any) => (
                                <div key={item.id} className="border-b border-slate-100 py-3 last:border-0">
                                    <p className="font-medium text-slate-700">{item.user?.name ?? 'Student'}</p>
                                    <p className="mt-0.5 text-xs text-slate-400">
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
                            {recentCourses.map((course: any) => (
                                <Link
                                    key={course.id}
                                    href={`/admin/courses/${course.slug}`}
                                    className="border border-slate-200 p-4 transition hover:border-purple-300"
                                >
                                    <p className="line-clamp-2 font-medium text-slate-700">{course.title}</p>
                                    <p className="mt-2 text-xs text-slate-400 capitalize">
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

function Kpi({ title, value, icon, compact = false }: any) {
    return (
        <div className="border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm text-slate-500">
                <span>{title}</span>
                <span className="bg-purple-50 p-2 text-purple-600">{icon}</span>
            </div>
            <p className={`mt-3 font-bold text-slate-800 ${compact ? 'text-xl' : 'text-2xl'}`}>{value}</p>
        </div>
    );
}
function Panel({ title, children, className = '' }: any) {
    return (
        <section className={`border border-slate-200/80 bg-white p-6 shadow-sm ${className}`}>
            <div className="mb-4 border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            </div>
            {children}
        </section>
    );
}
function Empty({ text }: { text: string }) {
    return <p className="py-8 text-center text-sm text-slate-400">{text}</p>;
}
function rupiah(value: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}
function date(value?: string) {
    return value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value)) : 'Recently';
}

Dashboard.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
