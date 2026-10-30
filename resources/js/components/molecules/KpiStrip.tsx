import type { ReactNode } from 'react';

export interface KpiItem {
    icon: ReactNode;
    label: string;
    value: ReactNode;
    sub: string;
    tint: string;
}

interface KpiStripProps {
    items: KpiItem[];
}

export default function KpiStrip({ items }: KpiStripProps) {
    return (
        <div className="overflow-hidden border border-slate-200 bg-slate-100 shadow-xs dark:border-slate-700 dark:bg-slate-700">
            <div className="grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-5">
                {items.map((item) => (
                    <div key={item.label} className="flex items-start gap-3 bg-white p-4 sm:p-5 dark:bg-[#1e1f24]">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center ${item.tint}`}>{item.icon}</div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">{item.label}</p>
                            <p className="mt-1 truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl dark:text-white">{item.value}</p>
                            <p className="mt-0.5 truncate text-[11px] text-slate-400 dark:text-slate-500">{item.sub}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
