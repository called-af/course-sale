import clsx from 'clsx';

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    label: string;
    className?: string;
}

export default function TabButton({ active, onClick, label, className }: TabButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={clsx(
                'px-3 py-1.5 text-xs font-semibold transition',
                active
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#1e1f24] dark:text-slate-400 dark:hover:bg-slate-700',
                className,
            )}
        >
            {label}
        </button>
    );
}
