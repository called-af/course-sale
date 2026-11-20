import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, ClipboardCheck, CreditCard, DollarSign, GraduationCap, LayoutGrid, ShoppingBag, Trophy, UserPlus, Users } from 'lucide-react';
import Button from '@/components/atoms/Button';
import DashboardPanel from '@/components/molecules/DashboardPanel';
import KpiStrip from '@/components/molecules/KpiStrip';
import PageHeader from '@/components/molecules/PageHeader';
import RecentEnrollmentsList from '@/components/molecules/RecentEnrollmentsList';
import StatusBreakdown from '@/components/molecules/StatusBreakdown';
import AdminLayout from '@/components/templates/AdminLayout';
import { formatRupiah } from '@/lib/currency';
import type { RecentEnrollment } from '@/types/dashboard';
import type { SharedPageProps } from '@/types/shared';

interface AdminMetrics {
    totalUsers?: number;
    totalCourses?: number;
    activeEnrollments?: number;
    revenue?: number;
    revenueThisMonth?: number;
    paidOrders?: number;
    pendingOrders?: number;
    pendingReviews?: number;
    totalInstructors?: number;
    totalStudents?: number;
}

interface CourseStatusCounts {
    published?: number;
    review?: number;
    draft?: number;
    archived?: number;
}

interface AdminTopCourse {
    id: number;
    title: string;
    slug: string;
    enrollments_count: number;
}

interface AdminRecentCourse {
    id: number;
    title: string;
    slug: string;
    status: string;
    created_at?: string;
}

interface AdminRecentOrder {
    id: number;
    order_number: string;
    status: string;
    total_price: number;
    currency?: string;
    created_at?: string;
    paid_at?: string | null;
    items_count?: number;
    course_title?: string | null;
    user?: { id: number; name: string } | null;
}

interface AdminDashboardProps extends SharedPageProps {
    metrics?: AdminMetrics;
    courseStatusCounts?: CourseStatusCounts;
    topCourses?: AdminTopCourse[];
    recentEnrollments?: RecentEnrollment[];
    recentCourses?: AdminRecentCourse[];
    recentOrders?: AdminRecentOrder[];
}

const orderStatusMeta: Record<string, { label: string; className: string }> = {
    paid: { label: 'Paid', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
    failed: { label: 'Failed', className: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' },
    expired: { label: 'Expired', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    refunded: { label: 'Refunded', className: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400' },
    chargeback: { label: 'Chargeback', className: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' },
};

export default function Dashboard() {
    const {
        auth,
        metrics = {},
        courseStatusCounts = {},
        topCourses = [],
        recentEnrollments = [],
        recentCourses = [],
        recentOrders = [],
    } = usePage<AdminDashboardProps>().props;

    const published = courseStatusCounts.published ?? 0;
    const review = courseStatusCounts.review ?? 0;
    const draft = courseStatusCounts.draft ?? 0;
    const archived = courseStatusCounts.archived ?? 0;
    const totalCourses = metrics.totalCourses ?? 0;

    const statusRows = [
        { key: 'published', label: 'Published', color: 'bg-emerald-500', value: published },
        { key: 'review', label: 'In Review', color: 'bg-amber-500', value: review },
        { key: 'draft', label: 'Draft', color: 'bg-slate-400', value: draft },
        ...(archived > 0 ? [{ key: 'archived', label: 'Archived', color: 'bg-rose-400', value: archived }] : []),
    ];

    return (
        <>
            <Head title="Admin Dashboard" />
            <div className="max-w-8xl mx-auto space-y-6 sm:space-y-8">
                <PageHeader
                    breadcrumbs={[{ label: 'Admin' }, { label: 'Dashboard' }]}
                    title={`Welcome back, ${auth.user.name}`}
                    description="Monitor platform performance, course operations, and recent activity across the marketplace."
                    stats={[
                        { icon: <Users size={18} />, value: metrics.totalUsers ?? 0, label: 'Users' },
                        { icon: <BookOpen size={18} />, value: totalCourses, label: 'Courses' },
                        { icon: <GraduationCap size={18} />, value: metrics.activeEnrollments ?? 0, label: 'Enrollments' },
                    ]}
                    actions={
                        <Link href="/admin/courses">
                            <Button size="sm" leftIcon={<ClipboardCheck size={14} />} className="!rounded-none">
                                Manage Courses
                            </Button>
                        </Link>
                    }
                />

                <KpiStrip
                    items={[
                        {
                            icon: <Users size={16} />,
                            label: 'Total Users',
                            value: metrics.totalUsers ?? 0,
                            sub: `${metrics.totalStudents ?? 0} students · ${metrics.totalInstructors ?? 0} instructors`,
                            tint: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
                        },
                        {
                            icon: <BookOpen size={16} />,
                            label: 'Total Courses',
                            value: totalCourses,
                            sub: `${published} published · ${review} in review`,
                            tint: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
                        },
                        {
                            icon: <GraduationCap size={16} />,
                            label: 'Active Enrollments',
                            value: metrics.activeEnrollments ?? 0,
                            sub: 'Currently active learning access',
                            tint: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400',
                        },
                        {
                            icon: <DollarSign size={16} />,
                            label: 'Paid Revenue',
                            value: formatRupiah(metrics.revenue ?? 0),
                            sub: `${formatRupiah(metrics.revenueThisMonth ?? 0)} this month`,
                            tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
                        },
                        {
                            icon: <ClipboardCheck size={16} />,
                            label: 'Courses In Review',
                            value: review,
                            sub: review > 0 ? 'Needs approval attention' : 'No pending reviews',
                            tint: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
                        },
                    ]}
                />

                <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
                    <div className="space-y-6 sm:space-y-8 lg:col-span-2">
                        <DashboardPanel title="Top Courses" description="Courses with the highest active enrollments." icon={<Trophy size={15} />}>
                            {topCourses.length ? (
                                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {topCourses.map((course) => (
                                        <Link
                                            key={course.id}
                                            href={`/admin/courses/${course.slug}`}
                                            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3 text-slate-700 transition hover:text-purple-700 dark:text-slate-200 dark:hover:text-purple-400"
                                        >
                                            <p className="min-w-0 flex-1 truncate font-medium">{course.title}</p>
                                            <span className="shrink-0 text-xs font-semibold text-purple-700 sm:text-sm dark:text-purple-400">
                                                {course.enrollments_count} students
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <Empty text="No course data yet." />
                            )}
                        </DashboardPanel>

                        <DashboardPanel
                            title="Recent Orders"
                            description="Latest transactions and payment activity."
                            icon={<ShoppingBag size={15} />}
                        >
                            {recentOrders.length ? (
                                <div className="space-y-3">
                                    {recentOrders.map((order) => {
                                        const status = orderStatusMeta[order.status] ?? {
                                            label: order.status,
                                            className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                                        };

                                        return (
                                            <div
                                                key={order.id}
                                                className="flex flex-col gap-2 border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700"
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                            {order.order_number}
                                                        </p>
                                                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>
                                                            {status.label}
                                                        </span>
                                                    </div>
                                                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                                        {order.user?.name ?? 'User'}
                                                        {order.course_title ? ` · ${order.course_title}` : ''}
                                                        {order.items_count && order.items_count > 1 ? ` (+${order.items_count - 1} more)` : ''}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{date(order.created_at)}</p>
                                                </div>
                                                <div className="shrink-0 text-left sm:text-right">
                                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                                        {formatRupiah(order.total_price)}
                                                    </p>
                                                    <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                                                        <CreditCard size={11} /> {order.currency ?? 'IDR'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <Empty text="No orders yet." />
                            )}
                        </DashboardPanel>

                        <DashboardPanel title="Recent Courses" description="Latest courses created on the platform." icon={<BookOpen size={15} />}>
                            {recentCourses.length ? (
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                        </DashboardPanel>
                    </div>

                    <div className="space-y-6 sm:space-y-8">
                        <DashboardPanel title="Course Status" description="Publication and review breakdown." icon={<LayoutGrid size={15} />}>
                            <StatusBreakdown items={statusRows} total={totalCourses} />
                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-700">
                                <span className="text-slate-400 dark:text-slate-500">Paid orders</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">{metrics.paidOrders ?? 0}</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="text-slate-400 dark:text-slate-500">Pending orders</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">{metrics.pendingOrders ?? 0}</span>
                            </div>
                        </DashboardPanel>

                        <DashboardPanel title="Recent Enrollments" description="Students who recently joined courses." icon={<UserPlus size={15} />}>
                            <RecentEnrollmentsList enrollments={recentEnrollments ?? []} />
                        </DashboardPanel>

                        <DashboardPanel title="Platform Snapshot" description="Quick operational highlights." icon={<Users size={15} />}>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <Snapshot label="Students" value={metrics.totalStudents ?? 0} />
                                <Snapshot label="Instructors" value={metrics.totalInstructors ?? 0} />
                                <Snapshot label="Pending orders" value={metrics.pendingOrders ?? 0} />
                                <Snapshot label="Revenue (month)" value={formatRupiah(metrics.revenueThisMonth ?? 0)} compact />
                            </div>
                        </DashboardPanel>
                    </div>
                </div>
            </div>
        </>
    );
}

function Snapshot({ label, value, compact = false }: { label: string; value: React.ReactNode; compact?: boolean }) {
    return (
        <div className="border border-slate-100 bg-slate-50/60 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/40">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className={`mt-0.5 font-bold text-slate-800 dark:text-slate-100 ${compact ? 'text-xs sm:text-sm' : 'text-sm'}`}>{value}</p>
        </div>
    );
}

function Empty({ text }: { text: string }) {
    return <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">{text}</p>;
}

function date(value?: string) {
    return value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value)) : 'Recently';
}

Dashboard.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
