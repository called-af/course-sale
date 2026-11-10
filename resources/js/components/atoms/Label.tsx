import type { LabelHTMLAttributes } from 'react';

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export default function Label({ className, ...props }: LabelProps) {
    return <label {...props} className={`text-sm font-medium text-slate-700 dark:text-slate-300 ${className ?? ''}`} />;
}
