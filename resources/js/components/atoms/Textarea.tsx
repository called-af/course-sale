import type { TextareaHTMLAttributes } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export default function Textarea({ className, ...props }: TextareaProps) {
    return (
        <textarea
            {...props}
            className={`resize-y border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-purple-700 focus:ring-1 focus:ring-purple-700 dark:border-slate-600 dark:bg-[#141416] dark:text-white dark:placeholder-slate-500 dark:focus:border-purple-500 dark:focus:ring-purple-500 ${className ?? ''} `}
        />
    );
}
