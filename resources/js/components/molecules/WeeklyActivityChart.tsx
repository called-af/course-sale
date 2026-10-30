import type { WeeklyActivityItem } from '@/types/dashboard';

interface WeeklyActivityChartProps {
    days: WeeklyActivityItem[];
    emptyLabel?: string;
    caption?: string;
    unitLabel?: string;
}

export default function WeeklyActivityChart({ days, emptyLabel = '·', caption, unitLabel = 'lessons completed' }: WeeklyActivityChartProps) {
    return (
        <div>
            <div className="grid grid-cols-7 gap-2 text-center">
                {days.map((day) => {
                    const hasActivity = day.count > 0;

                    return (
                        <div key={day.date} className="flex flex-col items-center gap-1.5">
                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{day.day_name}</span>
                            <div
                                className={`flex h-10 w-full items-center justify-center text-xs font-bold transition ${
                                    hasActivity
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                                } ${day.is_today ? 'ring-2 ring-purple-400 dark:ring-purple-500' : ''}`}
                                title={`${day.date}: ${day.count} ${unitLabel}`}
                            >
                                {hasActivity ? day.count : emptyLabel}
                            </div>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500">{day.is_today ? 'Today' : day.date.slice(-2)}</span>
                        </div>
                    );
                })}
            </div>

            {caption && <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">{caption}</p>}
        </div>
    );
}
