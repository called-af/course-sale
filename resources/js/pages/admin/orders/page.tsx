import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowUpRight,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    Clock3,
    Download,
    Inbox,
    Receipt,
    RotateCcw,
    Search,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import PageHeader from '@/components/molecules/PageHeader';
import AdminLayout from '@/components/templates/AdminLayout';
import { formatRupiah } from '@/lib/currency';

type OrderItem = {
    id: number;
    course_id: number;
    course_title: string;
    course_price: number;
    course?: { id: number; title: string; slug: string; thumbnail_url?: string };
};

type AdminOrder = {
    id: number;
    order_number: string;
    total_price: number;
    status: string;
    currency: string;
    created_at?: string | null;
    paid_at: string | null;
    expires_at: string | null;
    user?: { id: number; name: string; email: string } | null;
    items: OrderItem[];
};

interface Paginator<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from?: number | null;
    to?: number | null;
}

interface StatusStat {
    count: number;
    amount: number;
}

interface OrderStats {
    revenue: number;
    total_orders: number;
    pending: StatusStat;
    paid: StatusStat;
    failed: StatusStat;
    expired: StatusStat;
    refunded: StatusStat;
    chargeback: StatusStat;
}

const EMPTY_STAT: StatusStat = { count: 0, amount: 0 };

const EMPTY_STATS: OrderStats = {
    revenue: 0,
    total_orders: 0,
    pending: EMPTY_STAT,
    paid: EMPTY_STAT,
    failed: EMPTY_STAT,
    expired: EMPTY_STAT,
    refunded: EMPTY_STAT,
    chargeback: EMPTY_STAT,
};

const STATUS_META: Record<string, { label: string; badge: string; dot: string }> = {
    pending: {
        label: 'Pending',
        badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
        dot: 'bg-amber-500',
    },
    paid: {
        label: 'Paid',
        badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
        dot: 'bg-emerald-500',
    },
    failed: {
        label: 'Failed',
        badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
        dot: 'bg-rose-500',
    },
    expired: {
        label: 'Expired',
        badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        dot: 'bg-slate-400',
    },
    refunded: {
        label: 'Refund',
        badge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
        dot: 'bg-sky-500',
    },
    chargeback: {
        label: 'Chargeback',
        badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
        dot: 'bg-rose-600',
    },
};

const STATUS_TABS = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' },
    { value: 'expired', label: 'Expired' },
    { value: 'refunded', label: 'Refund' },
    { value: 'chargeback', label: 'Chargeback' },
];

const TONES: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
};

function formatDate(value?: string | null): string {
    if (!value) return '—';

    return new Date(value).toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function initials(name?: string | null): string {
    if (!name) return '?';

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
}

function StatusBadge({ status }: { status: string }) {
    const meta = STATUS_META[status] ?? {
        label: status,
        badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
        dot: 'bg-slate-400',
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold ${meta.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
        </span>
    );
}

export default function AdminOrders({
    orders = { data: [], current_page: 1, last_page: 1, total: 0 },
    stats = EMPTY_STATS,
    filters,
}: {
    orders?: Paginator<AdminOrder>;
    stats?: OrderStats;
    filters?: { search?: string; status?: string | null };
}) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [status, setStatus] = useState(filters?.status ?? 'all');
    const firstRender = useRef(true);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;

            return;
        }

        const timer = window.setTimeout(() => {
            router.get(
                '/admin/orders',
                {
                    search: search || undefined,
                    status: status === 'all' ? undefined : status,
                },
                {
                    only: ['orders', 'filters'],
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);

        return () => window.clearTimeout(timer);
    }, [search, status]);

    const statusCount = (value: string): number => {
        if (value === 'all') return stats.total_orders;

        return (stats[value as keyof Pick<OrderStats, 'pending' | 'paid' | 'failed' | 'expired' | 'refunded' | 'chargeback'>] ?? EMPTY_STAT).count;
    };

    const changePage = (page: number) => {
        router.get(
            '/admin/orders',
            {
                search: search || undefined,
                status: status === 'all' ? undefined : status,
                page,
            },
            {
                only: ['orders', 'filters'],
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const summaryCards = [
        {
            label: 'Total Revenue',
            value: formatRupiah(stats.revenue),
            hint: `${stats.paid.count} paid orders`,
            icon: CircleDollarSign,
            tone: 'emerald',
        },
        {
            label: 'Total Orders',
            value: Number(stats.total_orders).toLocaleString('en-US'),
            hint: 'All payment statuses',
            icon: Receipt,
            tone: 'purple',
        },
        {
            label: 'Awaiting Payment',
            value: Number(stats.pending.count).toLocaleString('en-US'),
            hint: formatRupiah(stats.pending.amount),
            icon: Clock3,
            tone: 'amber',
        },
        {
            label: 'Failed / Expired',
            value: Number(stats.failed.count + stats.expired.count).toLocaleString('en-US'),
            hint: formatRupiah(stats.failed.amount + stats.expired.amount),
            icon: XCircle,
            tone: 'sky',
        },
    ];

    const exportUrl = '/admin/orders/export';

    return (
        <AdminLayout>
            <Head title="Orders & Revenue" />

            <div className="mx-auto max-w-7xl space-y-6">
                <PageHeader
                    breadcrumbs={[{ label: 'Admin' }, { label: 'Orders & Revenue' }]}
                    title="Orders & Revenue"
                    description="Monitor transactions, payment statuses, and platform revenue."
                    actions={
                        <a
                            href={exportUrl}
                            className="flex w-full items-center justify-center gap-2 border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20 sm:w-auto"
                        >
                            <Download size={16} /> Export CSV
                        </a>
                    }
                />

                {/* Summary */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((card) => (
                        <div key={card.label} className="border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#1e1f24]">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                                    <p className="mt-2 truncate text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                                    <p className="mt-1 truncate text-[11px] text-slate-400 dark:text-slate-500">{card.hint}</p>
                                </div>
                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center ${TONES[card.tone]}`}>
                                    <card.icon size={19} />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Orders table */}
                <div className="border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1e1f24]">
                    <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center dark:border-slate-700">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Order List</h2>
                                <span className="border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[11px] font-bold text-purple-600 dark:text-purple-300">
                                    {orders.total}
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Click an order number to view payment details.</p>
                        </div>

                        <div className="relative w-full sm:w-80">
                            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search orders, students, or courses..."
                                className="w-full border border-slate-200 bg-white py-2 pr-9 pl-9 text-sm text-slate-700 transition-colors placeholder:text-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-200"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute top-1/2 right-2.5 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                    aria-label="Clear search"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Status filter */}
                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3 sm:px-6 dark:border-slate-700">
                        {STATUS_TABS.map((tab) => {
                            const active = status === tab.value;
                            const count = statusCount(tab.value);

                            return (
                                <button
                                    key={tab.value}
                                    type="button"
                                    onClick={() => setStatus(tab.value)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                                        active
                                            ? 'bg-purple-600 text-white'
                                            : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-300 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {tab.label}
                                    <span className={active ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}>{count}</span>
                                </button>
                            );
                        })}
                    </div>

                    {orders.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                            <span className="flex h-12 w-12 items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                <Inbox size={22} />
                            </span>
                            <p className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-200">No orders found</p>
                            <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                                {search || status !== 'all'
                                    ? 'Try adjusting your search keywords or status filters.'
                                    : 'Orders will appear here after students complete checkout.'}
                            </p>
                            {(search || status !== 'all') && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        setStatus('all');
                                    }}
                                    className="mt-4 inline-flex items-center gap-1.5 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <RotateCcw size={13} /> Reset filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Mobile: order cards */}
                            <div className="space-y-3 p-4 lg:hidden">
                                {orders.data.map((order) => {
                                    const firstItem = order.items?.[0];
                                    const extraItems = Math.max((order.items?.length ?? 0) - 1, 0);

                                    return (
                                        <div key={order.id} className="border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#1e1f24]">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <Link
                                                        href={`/admin/orders/${order.order_number}`}
                                                        className="font-mono text-xs font-semibold break-all text-purple-700 hover:underline dark:text-purple-400"
                                                    >
                                                        {order.order_number}
                                                    </Link>
                                                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                                                        {formatDate(order.created_at)}
                                                    </p>
                                                </div>
                                                <StatusBadge status={order.status} />
                                            </div>

                                            <div className="mt-3 flex items-center gap-2.5">
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-purple-100 text-[11px] font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                                                    {initials(order.user?.name)}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                                                        {order.user?.name ?? '—'}
                                                    </p>
                                                    <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                                                        {order.user?.email ?? '—'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center gap-2.5 border-t border-slate-100 pt-3 dark:border-slate-700">
                                                {firstItem?.course?.thumbnail_url ? (
                                                    <img
                                                        src={firstItem.course.thumbnail_url}
                                                        alt={firstItem.course_title}
                                                        className="h-10 w-16 shrink-0 border border-slate-200 object-cover dark:border-slate-700"
                                                    />
                                                ) : (
                                                    <span className="flex h-10 w-16 shrink-0 items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                                        <Receipt size={16} />
                                                    </span>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="line-clamp-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                                                        {firstItem?.course_title ?? '—'}
                                                    </p>
                                                    {extraItems > 0 && (
                                                        <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                                                            +{extraItems} more courses
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                                                <div>
                                                    <p className="text-[10px] tracking-wide text-slate-400 uppercase dark:text-slate-500">Total</p>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {formatRupiah(order.total_price)}
                                                    </p>
                                                </div>
                                                <Link
                                                    href={`/admin/orders/${order.order_number}`}
                                                    className="inline-flex items-center gap-1 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-purple-300 hover:text-purple-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-purple-700 dark:hover:text-purple-300"
                                                >
                                                    Detail <ArrowUpRight size={13} />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop: table */}
                            <div className="hidden overflow-x-auto lg:block">
                                <table className="w-full min-w-[860px] text-left text-sm">
                                    <thead className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/30">
                                        <tr className="text-[11px] tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                            <th className="px-5 py-3 font-semibold sm:px-6">Order</th>
                                            <th className="px-4 py-3 font-semibold">Student</th>
                                            <th className="px-4 py-3 font-semibold">Course</th>
                                            <th className="px-4 py-3 text-right font-semibold">Amount</th>
                                            <th className="px-4 py-3 font-semibold">Status</th>
                                            <th className="px-5 py-3 sm:px-6" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {orders.data.map((order) => {
                                            const firstItem = order.items?.[0];
                                            const extraItems = Math.max((order.items?.length ?? 0) - 1, 0);

                                            return (
                                                <tr key={order.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                                                    <td className="px-5 py-4 align-top sm:px-6">
                                                        <Link
                                                            href={`/admin/orders/${order.order_number}`}
                                                            className="font-mono text-xs font-semibold text-purple-700 hover:underline dark:text-purple-400"
                                                        >
                                                            {order.order_number}
                                                        </Link>
                                                        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                                                            {formatDate(order.created_at)}
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-4 align-top">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-purple-100 text-[11px] font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                                                                {initials(order.user?.name)}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                                                                    {order.user?.name ?? '—'}
                                                                </p>
                                                                <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                                                                    {order.user?.email ?? '—'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-4 align-top">
                                                        <div className="flex items-center gap-2.5">
                                                            {firstItem?.course?.thumbnail_url ? (
                                                                <img
                                                                    src={firstItem.course.thumbnail_url}
                                                                    alt={firstItem.course_title}
                                                                    className="h-9 w-14 shrink-0 border border-slate-200 object-cover dark:border-slate-700"
                                                                />
                                                            ) : (
                                                                <span className="flex h-9 w-14 shrink-0 items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                                                    <Receipt size={16} />
                                                                </span>
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="line-clamp-2 max-w-xs text-sm font-medium text-slate-800 dark:text-slate-200">
                                                                    {firstItem?.course_title ?? '—'}
                                                                </p>
                                                                {extraItems > 0 && (
                                                                    <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                                                                        +{extraItems} more courses
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-4 text-right align-top font-semibold whitespace-nowrap text-slate-900 dark:text-white">
                                                        {formatRupiah(order.total_price)}
                                                    </td>

                                                    <td className="px-4 py-4 align-top">
                                                        <StatusBadge status={order.status} />
                                                    </td>

                                                    <td className="px-5 py-4 text-right align-top sm:px-6">
                                                        <Link
                                                            href={`/admin/orders/${order.order_number}`}
                                                            className="inline-flex items-center gap-1 border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-500 transition-colors hover:border-purple-300 hover:text-purple-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-purple-700 dark:hover:text-purple-300"
                                                        >
                                                            Detail <ArrowUpRight size={12} />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* Pagination */}
                    {orders.total > 0 && (
                        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-700">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{orders.from ?? 0}</span>–
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{orders.to ?? 0}</span> of{' '}
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{orders.total}</span> orders
                            </p>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => changePage(orders.current_page - 1)}
                                    disabled={orders.current_page <= 1}
                                    className="inline-flex items-center gap-1 border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <ChevronLeft size={14} /> Previous
                                </button>
                                <span className="px-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                    {orders.current_page} / {orders.last_page}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => changePage(orders.current_page + 1)}
                                    disabled={orders.current_page >= orders.last_page}
                                    className="inline-flex items-center gap-1 border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Next <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        Total revenue is calculated from orders with <span className="font-semibold">Paid</span> status.
                    </p>
                    <Link
                        href="/admin/dashboard"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-700 hover:underline dark:text-purple-400"
                    >
                        <CheckCircle2 size={15} /> Back to dashboard
                    </Link>
                </div>
            </div>
        </AdminLayout>
    );
}
