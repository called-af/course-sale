import type { TextareaHTMLAttributes } from 'react';
import Label from '@/components/atoms/Label';
import Textarea from '@/components/atoms/Textarea';

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    error?: string;
};

export default function TextAreaField({ label, error, className, ...props }: TextAreaFieldProps) {
    return (
        <div className="space-y-1">
            {label && <Label>{label}</Label>}

            <Textarea {...props} className={`w-full ${className ?? ''}`} />

            {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        </div>
    );
}
