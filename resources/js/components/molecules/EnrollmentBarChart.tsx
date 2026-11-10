import type { WeeklyActivityItem } from '@/types/dashboard';

interface EnrollmentBarChartProps {
    days: WeeklyActivityItem[];
    caption?: string;
}

export default function EnrollmentBarChart({ days, caption }: EnrollmentBarChartProps) {
    const max = Math.max(...days.map((day) => day.count), 1);

    return (
        <div>
            <div className="flex h-36 items-end gap-2 sm:gap-3">
                {days.map((day) => {
                    const height = Math.max(6, Math.round((day.count / max) * 100));

                    return (
                        <div key={day.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{day.count > 0 ? day.count : ''}</span>
                            <div className="flex w-full flex-1 items-end">
                                <div
                                    className={`w-full transition-all duration-500 ${
                                        day.count > 0 ? 'bg-gradient-to-t from-purple-600 to-indigo-400' : 'bg-slate-100 dark:bg-slate-700'
                                    } ${day.is_today ? 'ring-2 ring-purple-300 ring-offset-1 dark:ring-purple-600 dark:ring-offset-slate-800' : ''}`}
                                    style={{ height: `${height}%` }}
                                    title={`${day.date}: ${day.count} new students`}
                                />
                            </div>
                            <span
                                className={`text-[10px] ${day.is_today ? 'font-bold text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'}`}
                            >
                                {day.day_name}
                            </span>
                        </div>
                    );
                })}
            </div>

            {caption && <p className="mt-5 text-center text-xs text-slate-400 dark:text-slate-500">{caption}</p>}
        </div>
    );
}
