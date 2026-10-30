import { CheckCircle } from 'lucide-react';
import type { RecentActivityItem } from '@/types/dashboard';

interface ActivityTimelineProps {
    activities: RecentActivityItem[];
}

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
    if (activities.length === 0) {
        return <p className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">No recent learning activity.</p>;
    }

    return (
        <div className="space-y-3.5">
            {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 text-xs">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                        <CheckCircle size={12} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 font-medium text-slate-800 dark:text-slate-200">{activity.title}</p>
                        {activity.course_title && (
                            <p className="line-clamp-1 text-[11px] text-slate-400 dark:text-slate-500">{activity.course_title}</p>
                        )}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{activity.time_ago}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
