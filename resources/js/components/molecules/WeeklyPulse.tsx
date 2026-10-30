import { Award, FileText, UserPlus } from 'lucide-react';

interface WeeklyPulseProps {
    weeklyEnrollments: number;
    totalLessons: number;
    completionRate: number;
    totalCertificates: number;
}

export default function WeeklyPulse({ weeklyEnrollments, totalLessons, completionRate, totalCertificates }: WeeklyPulseProps) {
    return (
        <div className="border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">This week</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">+{weeklyEnrollments}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">new students</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <UserPlus size={18} />
                </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <span className="text-slate-400 dark:text-slate-500">Total lessons</span>
                    <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
                        <FileText size={11} /> {totalLessons}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-400 dark:text-slate-500">Completion rate</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{completionRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-400 dark:text-slate-500">Certificates issued</span>
                    <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
                        <Award size={11} /> {totalCertificates}
                    </span>
                </div>
            </div>
        </div>
    );
}
