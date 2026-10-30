import { Link } from '@inertiajs/react';
import { ArrowRight, Award, CalendarDays, Clock, GraduationCap, Sparkles } from 'lucide-react';
import ActivityTimeline from '@/components/molecules/ActivityTimeline';
import CertificateCard from '@/components/molecules/CertificateCard';
import DashboardPanel from '@/components/molecules/DashboardPanel';
import WeeklyActivityChart from '@/components/molecules/WeeklyActivityChart';
import type { CertificateItem, RecentActivityItem, WeeklyActivityItem } from '@/types/dashboard';

interface StudentSidebarProps {
    totalCertificates: number;
    recentCertificates: CertificateItem[];
    weeklyActivity: WeeklyActivityItem[];
    quizzesCompleted: number;
    averageQuizScore: number | null;
    recentActivities: RecentActivityItem[];
    aiEnabled: boolean;
}

export default function StudentSidebar({
    totalCertificates,
    recentCertificates,
    weeklyActivity,
    quizzesCompleted,
    averageQuizScore,
    recentActivities,
    aiEnabled,
}: StudentSidebarProps) {
    return (
        <div className="space-y-8">
            <DashboardPanel
                title="Course Certificates"
                icon={<Award size={16} />}
                iconClassName="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400"
                action={
                    totalCertificates > 0 ? (
                        <Link
                            href="/student/certificates"
                            className="text-xs font-semibold text-purple-700 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                        >
                            View All ({totalCertificates})
                        </Link>
                    ) : undefined
                }
            >
                {recentCertificates.length > 0 ? (
                    <div className="space-y-3">
                        {recentCertificates.map((certificate) => (
                            <CertificateCard key={certificate.id} certificate={certificate} />
                        ))}
                    </div>
                ) : (
                    <div className="border border-dashed border-slate-200 p-5 text-center dark:border-slate-700">
                        <Award size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
                        <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">No Certificates Yet</p>
                        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                            Complete 100% of a course to automatically receive an official certificate of completion.
                        </p>
                    </div>
                )}
            </DashboardPanel>

            <DashboardPanel title="Weekly Activity" icon={<CalendarDays size={16} />}>
                <WeeklyActivityChart
                    days={weeklyActivity}
                    caption="Learning regularly every day helps you understand the material better."
                />

                {quizzesCompleted > 0 && averageQuizScore !== null && (
                    <div className="mt-4 flex items-center justify-between border border-indigo-100 bg-indigo-50/60 p-3 text-xs dark:border-indigo-900/50 dark:bg-indigo-950/40">
                        <div className="flex items-center gap-2">
                            <GraduationCap size={16} className="text-indigo-600 dark:text-indigo-400" />
                            <span className="font-medium text-indigo-950 dark:text-indigo-200">Average Quiz Score</span>
                        </div>
                        <span className="font-bold text-indigo-700 dark:text-indigo-300">
                            {averageQuizScore} / 100 ({quizzesCompleted} quizzes)
                        </span>
                    </div>
                )}
            </DashboardPanel>

            <DashboardPanel title="Activity History" icon={<Clock size={15} />}>
                <ActivityTimeline activities={recentActivities} />
            </DashboardPanel>

            {aiEnabled && (
                <div className="border border-purple-200 bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 p-5 text-white shadow-md">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center bg-purple-500/30 text-amber-300">
                            <Sparkles size={16} />
                        </div>
                        <h3 className="text-sm font-bold text-white">Need Help Learning?</h3>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-purple-200">
                        The AI Learning Assistant is ready to answer questions about course materials or recommend your next learning step.
                    </p>
                    <div className="mt-4">
                        <span className="inline-flex items-center gap-1.5 bg-purple-600/80 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-purple-600">
                            Click the AI icon in the bottom right corner
                            <ArrowRight size={12} />
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
