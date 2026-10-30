import { Search, X } from 'lucide-react';

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function SearchInput({ value, onChange, placeholder = 'Search...', className }: SearchInputProps) {
    return (
        <div className={className ?? 'relative w-full sm:w-64'}>
            <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full border border-slate-200 bg-slate-50 py-1.5 pr-8 pl-9 text-xs text-slate-800 placeholder-slate-400 transition focus:border-purple-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange('')}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Clear search"
                >
                    <X size={12} />
                </button>
            )}
        </div>
    );
}
