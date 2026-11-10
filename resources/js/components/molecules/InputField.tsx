import type { InputHTMLAttributes } from 'react';
import Input from '@/components/atoms/Input';
import Label from '@/components/atoms/Label';

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
};

export default function InputField({ label, id, name, className, error, ...props }: InputFieldProps) {
    const inputId = id ?? name;

    return (
        <div className="flex flex-col gap-1">
            {label && <Label htmlFor={inputId}>{label}</Label>}

            <Input id={inputId} name={name} className={` ${className ?? ''} `} {...props} />
            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
}
