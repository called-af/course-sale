import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    size?: 'md' | 'lg' | 'xl';
    children: ReactNode;
    footer?: ReactNode;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
};

export default function Modal({ open, onClose, title, size = 'md', children, footer }: ModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div
                className={`relative z-10 max-h-[90vh] w-full overflow-y-auto border border-gray-200 bg-white shadow-xl dark:border-slate-700 dark:bg-[#1e1f24] ${sizeClasses[size]}`}
            >
                {title && (
                    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-[#1e1f24]">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
                            aria-label="Close modal"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                <div className="px-4 py-3 text-sm text-gray-700 dark:text-slate-200">{children}</div>

                {footer && (
                    <div className="sticky bottom-0 flex justify-end gap-2 border-t border-gray-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-[#1e1f24]">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
