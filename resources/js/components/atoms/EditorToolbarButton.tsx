interface Props {
    active?: boolean;
    onMouseDown: (e: React.MouseEvent) => void;
    children: React.ReactNode;
    tooltip?: string;
}

export default function EditorToolbarButton({ active, onMouseDown, children, tooltip }: Props) {
    return (
        <div className="group relative">
            <button
                onMouseDown={onMouseDown}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-all select-none ${
                    active
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white'
                } `}
            >
                {children}
            </button>

            {tooltip && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-md bg-[#141416] px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    {tooltip}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
            )}
        </div>
    );
}
