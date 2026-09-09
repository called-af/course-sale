import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { CheckCircle2, MessageSquare, Trash2, XCircle } from 'lucide-react';
import AdminLayout from '@/components/templates/AdminLayout';
import PageHeader from '@/components/molecules/PageHeader';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';

interface CommentItem {
    id: number;
    body: string;
    parent_id: number | null;
    is_approved: boolean;
    created_at: string;
    user: { id: number; name: string };
    course: { id: number; title: string; slug: string };
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
        router.put(`/admin/comments/${id}/approve`, {}, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null),
        });
    };

    const reject = (id: number) => {
        setProcessingId(id);
        router.put(`/admin/comments/${id}/reject`, {}, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null),
        });
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
                <div className="grid grid-cols-3 gap-4">
                    <StatCard label="Total Comments" value={comments.length} />
                    <StatCard label="Approved" value={comments.filter((c) => c.is_approved).length} color="emerald" />
                    <StatCard label="Pending" value={pending} color={pending > 0 ? 'amber' : 'slate'} />
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 border-b border-slate-200">
                    {(['all', 'approved', 'pending'] as const).map((f) => (
                        <button
                            key={f}
                            type="button"
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2.5 text-sm font-semibold capitalize transition-colors border-b-2 ${
                                filter === f
                                    ? 'border-purple-600 text-purple-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
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
                    <div className="py-16 text-center text-slate-400">
                        <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No comments found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Course</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Comment</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((comment) => (
                                    <tr key={comment.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{comment.user.name}</td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/admin/courses/${comment.course.slug}`}
                                                className="font-medium text-purple-600 hover:underline line-clamp-1"
                                            >
                                                {comment.course.title}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 max-w-xs">
                                            <p className="line-clamp-2 text-slate-600">{comment.body}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={comment.parent_id ? 'info' : 'default'}>
                                                {comment.parent_id ? 'Reply' : 'Comment'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            {comment.is_approved ? (
                                                <Badge variant="success">Approved</Badge>
                                            ) : (
                                                <Badge variant="warning">Pending</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
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
                                                        className="!text-emerald-600 hover:!bg-emerald-50"
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
                                                        className="!text-amber-600 hover:!bg-amber-50"
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
                                                    className="!text-red-500 hover:!bg-red-50"
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
                )}
            </div>
        </>
    );
}

function StatCard({ label, value, color = 'slate' }: { label: string; value: number; color?: string }) {
    const colorMap: Record<string, string> = {
        slate: 'text-slate-800',
        emerald: 'text-emerald-600',
        amber: 'text-amber-600',
    };
    return (
        <div className="border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
            <p className={`mt-2 text-3xl font-extrabold tabular-nums ${colorMap[color] ?? colorMap.slate}`}>{value}</p>
        </div>
    );
}

AdminCommentsPage.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
