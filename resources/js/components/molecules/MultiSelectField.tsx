import { Search, X } from 'lucide-react';
import { useState } from 'react';
import Label from '@/components/atoms/Label';

type Option = {
    label: string;
    value: number;
};

type MultiSelectColor = 'purple' | 'indigo' | 'blue' | 'violet' | 'emerald' | 'amber' | 'rose';

const colorStyles: Record<MultiSelectColor, { selected: string; chip: string; remove: string; hover: string }> = {
    purple: {
        selected: 'border-purple-600 bg-purple-600 text-white',
        chip: 'border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-200',
        remove: 'hover:bg-purple-100 dark:hover:bg-purple-900',
        hover: 'hover:border-purple-400',
    },
    indigo: {
        selected: 'border-indigo-600 bg-indigo-600 text-white',
        chip: 'border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200',
        remove: 'hover:bg-indigo-100 dark:hover:bg-indigo-900',
        hover: 'hover:border-indigo-400',
    },
    blue: {
        selected: 'border-blue-600 bg-blue-600 text-white',
        chip: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200',
        remove: 'hover:bg-blue-100 dark:hover:bg-blue-900',
        hover: 'hover:border-blue-400',
    },
    violet: {
        selected: 'border-violet-600 bg-violet-600 text-white',
        chip: 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200',
        remove: 'hover:bg-violet-100 dark:hover:bg-violet-900',
        hover: 'hover:border-violet-400',
    },
    emerald: {
        selected: 'border-emerald-600 bg-emerald-600 text-white',
        chip: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
        remove: 'hover:bg-emerald-100 dark:hover:bg-emerald-900',
        hover: 'hover:border-emerald-400',
    },
    amber: {
        selected: 'border-amber-600 bg-amber-600 text-white',
        chip: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
        remove: 'hover:bg-amber-100 dark:hover:bg-amber-900',
        hover: 'hover:border-amber-400',
    },
    rose: {
        selected: 'border-rose-600 bg-rose-600 text-white',
        chip: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200',
        remove: 'hover:bg-rose-100 dark:hover:bg-rose-900',
        hover: 'hover:border-rose-400',
    },
};

interface MultiSelectFieldProps {
    label: string;
    options: Option[];
    value: number[];
    onChange: (values: number[]) => void;
    color?: MultiSelectColor;
}

export default function MultiSelectField({ label, options, value, onChange, color = 'indigo' }: MultiSelectFieldProps) {
    const styles = colorStyles[color];
    const [search, setSearch] = useState('');
    const matchingOptions = options.filter((option) => option.label.toLowerCase().includes(search.trim().toLowerCase()));
    const visibleOptions = matchingOptions.slice(0, 6);
    const selectedOptions = options.filter((option) => value.includes(option.value));

    const toggleValue = (optionValue: number) => {
        if (value.includes(optionValue)) {
            onChange(value.filter((v) => v !== optionValue));
            return;
        }
        onChange([...value, optionValue]);
    };

    return (
        <div className="flex flex-col gap-2">
            <Label>{label}</Label>

            <div className="flex items-center gap-2 border border-neutral-300 px-3 dark:border-slate-600">
                <Search className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search options..."
                    aria-label={`Search ${label || 'options'}`}
                    className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white"
                />
            </div>

            {selectedOptions.length > 0 && (
                <div className="flex flex-wrap gap-2" aria-label="Selected options">
                    {selectedOptions.map((option) => (
                        <span key={option.value} className={`inline-flex items-center gap-1 border px-2 py-1 text-xs font-medium ${styles.chip}`}>
                            {option.label}
                            <button
                                type="button"
                                onClick={() => toggleValue(option.value)}
                                aria-label={`Remove ${option.label}`}
                                className={`rounded-sm p-0.5 focus-visible:outline-2 focus-visible:outline-current ${styles.remove}`}
                            >
                                <X className="h-3 w-3" aria-hidden="true" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                {visibleOptions.map((option) => {
                    const selected = value.includes(option.value);
                    return (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => toggleValue(option.value)}
                            className={`border px-3 py-1 text-sm transition-colors ${
                                selected
                                    ? styles.selected
                                    : `border-neutral-300 bg-white text-neutral-700 dark:border-slate-600 dark:bg-[#1e1f24] dark:text-slate-200 ${styles.hover}`
                            }`}
                        >
                            {option.label}
                        </button>
                    );
                })}
                {visibleOptions.length === 0 && <p className="py-1 text-sm text-neutral-500 dark:text-slate-400">No matching options.</p>}
            </div>
            {matchingOptions.length > visibleOptions.length && (
                <p className="text-xs text-neutral-500 dark:text-slate-400">
                    Showing {visibleOptions.length} of {matchingOptions.length} matches. Refine your search to see more.
                </p>
            )}
        </div>
    );
}
