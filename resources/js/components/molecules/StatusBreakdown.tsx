export interface StatusBreakdownItem {
    key: string;
    label: string;
    color: string;
    value: number;
}

interface StatusBreakdownProps {
    items: StatusBreakdownItem[];
    total: number;
}

export default function StatusBreakdown({ items, total }: StatusBreakdownProps) {
    const safeTotal = total || 1;

    return (
        <div className="space-y-3.5">
            {items.map((item) => (
                <div key={item.key}>
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{item.label}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{item.value}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                        <div
                            className={`h-full transition-all duration-300 ${item.color}`}
                            style={{ width: `${Math.round((item.value / safeTotal) * 100)}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
