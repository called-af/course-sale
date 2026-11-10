import { CheckCircle } from 'lucide-react';
import Avatar from '@/components/atoms/Avatar';
import { formatDate } from '@/lib/dashboard';
import type { RecentEnrollment } from '@/types/dashboard';

interface RecentEnrollmentsListProps {
    enrollments: RecentEnrollment[];
}

export default function RecentEnrollmentsList({ enrollments }: RecentEnrollmentsListProps) {
    if (enrollments.length === 0) {
        return <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">No students have enrolled yet.</p>;
    }

    return (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-start gap-3 py-3">
                    <Avatar name={enrollment.user?.name} tone="indigo" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{enrollment.user?.name ?? 'Student'}</p>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400 dark:text-slate-500">{enrollment.course?.title ?? 'Course'}</p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(enrollment.enrolled_at)}</span>
                    </div>
                    <CheckCircle size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                </div>
            ))}
        </div>
    );
}
