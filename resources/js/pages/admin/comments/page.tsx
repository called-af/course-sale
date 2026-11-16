import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2, MessageSquare, Trash2, XCircle } from 'lucide-react';
import { useState } from 'react';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import PageHeader from '@/components/molecules/PageHeader';
import AdminLayout from '@/components/templates/AdminLayout';

interface CommentItem {
    id: number;
    body: string;
    parent_id: number | null;
    is_approved: boolean;
    created_at: string;
    user: { id: number; name: string };
    course: { id: number | null; title: string; slug: string | null };
}

interface Props {
    comments: CommentItem[];
}

function formatDate(s: string) {
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(s));
}

export default function AdminCommentsPage({ comments }: Props) {
    const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
    const [processingId, setProcessingId] = useState<number | null>(null);

    const filtered = comments.filter((c) => {
        if (filter === 'approved') return c.is_approved;
        if (filter === 'pending') return !c.is_approved;
        return true;
    });

    const pending = comments.filter((c) => !c.is_approved).length;

    const approve = (id: number) => {
        setProcessingId(id);
        router.put(
            `/admin/comments/${id}/approve`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingId(null),
            },
        );
    };

    const reject = (id: number) => {
        setProcessingId(id);
        router.put(
            `/admin/comments/${id}/reject`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingId(null),
            },
        );
    };

    const destroy = (id: number) => {
        if (!confirm('Permanently delete this comment?')) return;
        setProcessingId(id);
        router.delete(`/admin/comments/${id}`, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null),
        });
    };

    return (
        <>
            <Head title="Comment Moderation" />
            <div className="max-w-8xl mx-auto space-y-6">
                <PageHeader
                    breadcrumbs={[{ label: 'Admin' }, { label: 'Comments' }]}
                    title="Comment Moderation"
                    description="Manage and moderate course discussion comments."
                />

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard label="Total Comments" value={comments.length} />
                    <StatCard label="Approved" value={comments.filter((c) => c.is_approved).length} color="emerald" />
                    <StatCard label="Pending" value={pending} color={pending > 0 ? 'amber' : 'slate'} />
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
                    {(['all', 'approved', 'pending'] as const).map((f) => (
                        <button
                            key={f}
                            type="button"
                            onClick={() => setFilter(f)}
                            className={`border-b-2 px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
                                filter === f
                                    ? 'border-purple-600 text-purple-700 dark:text-purple-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                        >
                            {f}
                            {f === 'pending' && pending > 0 && (
                                <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center bg-amber-500 text-[10px] font-bold text-white">
                                    {pending}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Table */}
                {filtered.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 dark:text-slate-500">
                        <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No comments found.</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile: comment cards */}
                        <div className="space-y-3 lg:hidden">
                            {filtered.map((comment) => (
                                <div
                                    key={comment.id}
                                    className="border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#1e1f24]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                {comment.user.name}
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                                                {formatDate(comment.created_at)}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                                            <Badge variant={comment.parent_id ? 'info' : 'default'}>
                                                {comment.parent_id ? 'Reply' : 'Comment'}
                                            </Badge>
                                            {comment.is_approved ? (
                                                <Badge variant="success">Approved</Badge>
                                            ) : (
                                                <Badge variant="warning">Pending</Badge>
                                            )}
                                        </div>
                                    </div>

                                    <p className="mt-3 text-sm whitespace-pre-line text-slate-600 dark:text-slate-300">{comment.body}</p>

                                    <p className="mt-2 truncate text-xs">
                                        <span className="text-slate-400 dark:text-slate-500">Course: </span>
                                        {comment.course.slug ? (
                                            <Link
                                                href={`/admin/courses/${comment.course.slug}`}
                                                className="font-medium text-purple-600 hover:underline dark:text-purple-400"
                                            >
                                                {comment.course.title}
                                            </Link>
                                        ) : (
                                            <span className="font-medium text-slate-500 dark:text-slate-400">{comment.course.title}</span>
                                        )}
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-700">
                                        {!comment.is_approved ? (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => approve(comment.id)}
                                                isLoading={processingId === comment.id}
                                                leftIcon={<CheckCircle2 size={13} />}
                                                className="!text-emerald-600 hover:!bg-emerald-50 dark:hover:!bg-emerald-950/30"
                                            >
                                                Approve
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => reject(comment.id)}
                                                isLoading={processingId === comment.id}
                                                leftIcon={<XCircle size={13} />}
                                                className="!text-amber-600 hover:!bg-amber-50 dark:hover:!bg-amber-950/30"
                                            >
                                                Hide
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => destroy(comment.id)}
                                            isLoading={processingId === comment.id}
                                            leftIcon={<Trash2 size={13} />}
                                            className="!text-red-500 hover:!bg-red-50 dark:hover:!bg-red-950/30"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop: table */}
                        <div className="hidden overflow-x-auto border border-slate-200 bg-white shadow-sm lg:block dark:border-slate-700 dark:bg-[#1e1f24]">
                        <table className="w-full min-w-[900px] text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-[#1e1f24]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                        User
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                        Course
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                        Comment
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                        Type
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                        Date
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {filtered.map((comment) => (
                                    <tr key={comment.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                                        <td className="px-4 py-3 font-medium whitespace-nowrap text-slate-700 dark:text-slate-200">
                                            {comment.user.name}
                                        </td>
                                        <td className="px-4 py-3">
                                            {comment.course.slug ? (
                                                <Link
                                                    href={`/admin/courses/${comment.course.slug}`}
                                                    className="line-clamp-1 font-medium text-purple-600 hover:underline dark:text-purple-400"
                                                >
                                                    {comment.course.title}
                                                </Link>
                                            ) : (
                                                <span className="line-clamp-1 font-medium text-slate-500 dark:text-slate-400">
                                                    {comment.course.title}
                                                </span>
                                            )}
                                        </td>
                                        <td className="max-w-xs px-4 py-3">
                                            <p className="line-clamp-2 text-slate-600 dark:text-slate-300">{comment.body}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={comment.parent_id ? 'info' : 'default'}>{comment.parent_id ? 'Reply' : 'Comment'}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            {comment.is_approved ? (
                                                <Badge variant="success">Approved</Badge>
                                            ) : (
                                                <Badge variant="warning">Pending</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-400 dark:text-slate-500">
                                            {formatDate(comment.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {!comment.is_approved ? (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => approve(comment.id)}
                                                        isLoading={processingId === comment.id}
                                                        leftIcon={<CheckCircle2 size={13} />}
                                                        className="!text-emerald-600 hover:!bg-emerald-50 dark:hover:!bg-emerald-950/30"
                                                    >
                                                        Approve
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => reject(comment.id)}
                                                        isLoading={processingId === comment.id}
                                                        leftIcon={<XCircle size={13} />}
                                                        className="!text-amber-600 hover:!bg-amber-50 dark:hover:!bg-amber-950/30"
                                                    >
                                                        Hide
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => destroy(comment.id)}
                                                    isLoading={processingId === comment.id}
                                                    leftIcon={<Trash2 size={13} />}
                                                    className="!text-red-500 hover:!bg-red-50 dark:hover:!bg-red-950/30"
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

function StatCard({ label, value, color = 'slate' }: { label: string; value: number; color?: string }) {
    const colorMap: Record<string, string> = {
        slate: 'text-slate-800 dark:text-white',
        emerald: 'text-emerald-600 dark:text-emerald-400',
        amber: 'text-amber-600 dark:text-amber-400',
    };
    return (
        <div className="border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#1e1f24]">
            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">{label}</p>
            <p className={`mt-2 text-3xl font-extrabold tabular-nums ${colorMap[color] ?? colorMap.slate}`}>{value}</p>
        </div>
    );
}

AdminCommentsPage.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
