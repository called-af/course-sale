import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { CheckCircle2, Star, Trash2, XCircle } from 'lucide-react';
import AdminLayout from '@/components/templates/AdminLayout';
import PageHeader from '@/components/molecules/PageHeader';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import StarRating from '@/components/molecules/StarRating';

interface ReviewItem {
    id: number;
    rating: number;
    comment: string | null;
    is_approved: boolean;
    created_at: string;
    user: { id: number; name: string };
    course: { id: number; title: string; slug: string };
}

interface Props {
    reviews: ReviewItem[];
}

function formatDate(s: string) {
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(s));
}

export default function AdminReviewsPage({ reviews }: Props) {
    const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
    const [processingId, setProcessingId] = useState<number | null>(null);

    const filtered = reviews.filter((r) => {
        if (filter === 'approved') return r.is_approved;
        if (filter === 'pending') return !r.is_approved;
        return true;
    });

    const pending = reviews.filter((r) => !r.is_approved).length;

    const approve = (id: number) => {
        setProcessingId(id);
        router.put(`/admin/reviews/${id}/approve`, {}, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null),
        });
    };

    const reject = (id: number) => {
        setProcessingId(id);
        router.put(`/admin/reviews/${id}/reject`, {}, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null),
        });
    };

    const destroy = (id: number) => {
        if (!confirm('Permanently delete this review?')) return;
        setProcessingId(id);
        router.delete(`/admin/reviews/${id}`, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null),
        });
    };

    return (
        <>
            <Head title="Review Moderation" />
            <div className="max-w-8xl mx-auto space-y-6">
                <PageHeader
                    breadcrumbs={[{ label: 'Admin' }, { label: 'Reviews' }]}
                    title="Review Moderation"
                    description="Manage and moderate student course reviews."
                />

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <StatCard label="Total Reviews" value={reviews.length} />
                    <StatCard label="Approved" value={reviews.filter((r) => r.is_approved).length} color="emerald" />
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
                        <Star size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No reviews found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Course</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Rating</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Comment</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((review) => (
                                    <tr key={review.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-700">{review.user.name}</td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/admin/courses/${review.course.slug}`}
                                                className="font-medium text-purple-600 hover:underline line-clamp-1"
                                            >
                                                {review.course.title}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <StarRating value={review.rating} readonly size="sm" />
                                                <span className="text-xs font-semibold text-slate-600">{review.rating}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 max-w-xs">
                                            <p className="line-clamp-2 text-slate-600">{review.comment || <span className="text-slate-400 italic">No comment</span>}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            {review.is_approved ? (
                                                <Badge variant="success">Approved</Badge>
                                            ) : (
                                                <Badge variant="warning">Pending</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                                            {formatDate(review.created_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {!review.is_approved ? (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => approve(review.id)}
                                                        isLoading={processingId === review.id}
                                                        leftIcon={<CheckCircle2 size={13} />}
                                                        className="!text-emerald-600 hover:!bg-emerald-50"
                                                    >
                                                        Approve
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => reject(review.id)}
                                                        isLoading={processingId === review.id}
                                                        leftIcon={<XCircle size={13} />}
                                                        className="!text-amber-600 hover:!bg-amber-50"
                                                    >
                                                        Hide
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => destroy(review.id)}
                                                    isLoading={processingId === review.id}
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

AdminReviewsPage.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
