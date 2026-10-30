import { BarChart3, UserPlus } from 'lucide-react';
import DashboardPanel from '@/components/molecules/DashboardPanel';
import EnrollmentBarChart from '@/components/molecules/EnrollmentBarChart';
import type { WeeklyActivityItem } from '@/types/dashboard';

interface EnrollmentActivitySectionProps {
    trend: WeeklyActivityItem[];
    weeklyEnrollments: number;
}

export default function EnrollmentActivitySection({ trend, weeklyEnrollments }: EnrollmentActivitySectionProps) {
    return (
        <DashboardPanel
            title="Enrollment Activity"
            description="New students joining your courses over the last 7 days."
            icon={<BarChart3 size={16} />}
            action={
                <span className="inline-flex items-center gap-1 border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <UserPlus size={12} />+{weeklyEnrollments} this week
                </span>
            }
        >
            <EnrollmentBarChart
                days={trend}
                caption="Consistent publishing and engagement help keep enrollment momentum going."
            />
        </DashboardPanel>
    );
}
