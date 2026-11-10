import clsx from 'clsx';
import type { ChangeEvent } from 'react';
import { useState, useRef, useEffect } from 'react';
import Label from '@/components/atoms/Label';

type Aspect = 'square' | 'video';

interface ChooseFileProps {
    label?: string;
    value?: string | null;
    className?: string;
    aspect?: Aspect;
    onChange: (file: File | null) => void;
}

export default function ChooseFile({ label, value, className, aspect = 'square', onChange }: ChooseFileProps) {
    const [preview, setPreview] = useState<string | null>(value ?? null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setPreview(value ?? null);
    }, [value]);

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;

        if (!file) {
            onChange(null);
            setPreview(value ?? null);
            return;
        }

        const url = URL.createObjectURL(file);

        setPreview(url);
        onChange(file);
    }

    return (
        <div className="flex flex-col gap-1">
            {label && <Label>{label}</Label>}

            <div
                onClick={() => inputRef.current?.click()}
                className={clsx(
                    'relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-none border border-dashed border-neutral-300 bg-neutral-50 transition hover:bg-neutral-100',
                    'dark:border-slate-600 dark:bg-[#1e1f24] dark:hover:bg-slate-800',
                    aspect === 'square' && 'aspect-square',
                    aspect === 'video' && 'aspect-video',
                    className,
                )}
            >
                {preview ? (
                    <img src={preview} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                    <span className="text-[10px] text-neutral-400 dark:text-slate-500">IMG</span>
                )}

                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
            </div>
        </div>
    );
}
