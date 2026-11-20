import type { FormDataConvertible } from '@inertiajs/core';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ExternalLink, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import Button from '@/components/atoms/Button';
import PageHeader from '@/components/molecules/PageHeader';
import AdminLayout from '@/components/templates/AdminLayout';
import { normalizePaymentMethodKey, paymentLogoSrc } from '@/lib/payment-logos';
import type { CertificateOption, InstructorOption, TestimonialItem } from '@/types';

interface LandingSettingsPageProps {
    section: string;
    label: string;
    content: Record<string, unknown>;
    testimonials: TestimonialItem[];
    instructorOptions: InstructorOption[];
    certificateOptions: CertificateOption[];
}

type LandingContent = Record<string, unknown>;
type ListGetter = <T>(key: string) => T[];
type SetValue = (key: string, value: unknown) => void;
type UpdateItem = (key: string, index: number, field: string, value: unknown) => void;
type AddItem = (key: string, item: Record<string, unknown>) => void;

interface StatItem {
    value?: string;
    label?: string;
}

interface FooterLink {
    label?: string;
    href?: string;
}

interface FooterColumn {
    title?: string;
    links?: FooterLink[];
}

interface SocialItem {
    name?: string;
    href?: string;
}

interface LegalItem {
    label?: string;
    href?: string;
}

const SECTIONS = [
    { key: 'hero', label: 'Hero' },
    { key: 'about', label: 'About' },
    { key: 'courses', label: 'Courses' },
    { key: 'career', label: 'Career' },
    { key: 'instructor', label: 'Instructors' },
    { key: 'how_it_works', label: 'How it works' },
    { key: 'benefit', label: 'Benefits' },
    { key: 'certificate', label: 'Certificate' },
    { key: 'testimonial', label: 'Testimonials' },
    { key: 'faq', label: 'FAQ' },
    { key: 'trust', label: 'Trust bar' },
    { key: 'cta', label: 'CTA' },
    { key: 'footer', label: 'Footer' },
];

const STEP_ICON_OPTIONS = [
    { label: 'Search', value: 'search' },
    { label: 'Credit card', value: 'credit-card' },
    { label: 'Play', value: 'play-circle' },
    { label: 'Award', value: 'award' },
    { label: 'Sparkles', value: 'sparkles' },
];

const BENEFIT_ICON_OPTIONS = [
    { label: 'Infinity', value: 'infinity' },
    { label: 'Refresh', value: 'refresh' },
    { label: 'Award', value: 'award' },
    { label: 'Messages', value: 'messages' },
    { label: 'Download', value: 'download' },
    { label: 'Shield', value: 'shield' },
    { label: 'Sparkles', value: 'sparkles' },
];

interface PendingUpload {
    file: File;
    preview: string;
    kind?: 'photo' | 'avatar' | 'payment-logo';
    key?: string;
}

const inputClass =
    'w-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-purple-700 focus:ring-1 focus:ring-purple-700 dark:border-slate-600 dark:bg-[#141416] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-purple-500 dark:focus:ring-purple-500';

const labelClass = 'text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-400';
const hintClass = 'text-xs text-slate-400 dark:text-slate-500';

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
    return (
        <section className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#1e1f24]">
            <header className="border-b border-slate-200 px-5 py-3.5 dark:border-slate-700">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
                {hint && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
            </header>
            <div className="space-y-4 p-5">{children}</div>
        </section>
    );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <label className="block space-y-1.5">
            <span className={labelClass}>{label}</span>
            {children}
            {hint && <span className={`block ${hintClass}`}>{hint}</span>}
        </label>
    );
}

function TextField({
    label,
    value,
    onChange,
    placeholder,
    hint,
}: {
    label: string;
    value: unknown;
    onChange: (value: string) => void;
    placeholder?: string;
    hint?: string;
}) {
    return (
        <Field label={label} hint={hint}>
            <input
                className={inputClass}
                value={value == null ? '' : String(value)}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
            />
        </Field>
    );
}

function TextAreaField({
    label,
    value,
    onChange,
    rows = 3,
    hint,
    placeholder,
}: {
    label: string;
    value: unknown;
    onChange: (value: string) => void;
    rows?: number;
    hint?: string;
    placeholder?: string;
}) {
    return (
        <Field label={label} hint={hint}>
            <textarea
                className={inputClass}
                rows={rows}
                placeholder={placeholder}
                value={value == null ? '' : String(value)}
                onChange={(event) => onChange(event.target.value)}
            />
        </Field>
    );
}

function NumberField({
    label,
    value,
    onChange,
    min = 1,
    max = 24,
    hint,
}: {
    label: string;
    value: unknown;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    hint?: string;
}) {
    return (
        <Field label={label} hint={hint}>
            <input
                type="number"
                className={inputClass}
                min={min}
                max={max}
                value={value == null ? min : Number(value)}
                onChange={(event) => onChange(Number(event.target.value))}
            />
        </Field>
    );
}

function SelectInput({
    label,
    value,
    onChange,
    options,
    hint,
}: {
    label: string;
    value: unknown;
    onChange: (value: string) => void;
    options: { label: string; value: string }[];
    hint?: string;
}) {
    return (
        <Field label={label} hint={hint}>
            <select className={inputClass} value={value == null ? '' : String(value)} onChange={(event) => onChange(event.target.value)}>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </Field>
    );
}

function ToggleField({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (value: boolean) => void; hint?: string }) {
    return (
        <div className="space-y-1.5">
            <span className={labelClass}>{label}</span>
            <label className="inline-flex cursor-pointer items-center gap-3 border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-[#141416]">
                <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-purple-600" />
                <span className="text-sm text-slate-700 dark:text-slate-200">{checked ? 'Enabled' : 'Disabled'}</span>
            </label>
            {hint && <p className={hintClass}>{hint}</p>}
        </div>
    );
}

interface RepeaterColumn {
    key: string;
    label: string;
    type?: 'text' | 'textarea' | 'select';
    options?: { label: string; value: string }[];
    placeholder?: string;
    hint?: string;
}

function RepeaterField({
    label,
    hint,
    items,
    columns,
    onChange,
    addLabel,
    emptyItem,
}: {
    label: string;
    hint?: string;
    items: Record<string, unknown>[];
    columns: RepeaterColumn[];
    onChange: (items: Record<string, unknown>[]) => void;
    addLabel: string;
    emptyItem: Record<string, unknown>;
}) {
    const gridClass = columns.length >= 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : columns.length === 2 ? 'sm:grid-cols-2' : '';

    const update = (index: number, key: string, value: unknown) => {
        onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)));
    };

    const move = (index: number, step: number) => {
        const target = index + step;
        if (target < 0 || target >= items.length) {
            return;
        }

        const next = [...items];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    };

    return (
        <div className="space-y-2">
            <span className={labelClass}>{label}</span>
            {hint && <p className={hintClass}>{hint}</p>}

            <div className="space-y-3">
                {items.map((item, index) => (
                    <div key={index} className="space-y-3 border border-slate-200 p-4 dark:border-slate-700">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Item {index + 1}</span>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    aria-label="Move item up"
                                    disabled={index === 0}
                                    onClick={() => move(index, -1)}
                                    className="border border-slate-200 p-1.5 text-slate-500 transition-colors hover:border-purple-300 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-700"
                                >
                                    <ArrowUp size={13} />
                                </button>
                                <button
                                    type="button"
                                    aria-label="Move item down"
                                    disabled={index === items.length - 1}
                                    onClick={() => move(index, 1)}
                                    className="border border-slate-200 p-1.5 text-slate-500 transition-colors hover:border-purple-300 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-700"
                                >
                                    <ArrowDown size={13} />
                                </button>
                                <button
                                    type="button"
                                    aria-label="Remove item"
                                    onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                                    className="border border-slate-200 p-1.5 text-slate-400 transition-colors hover:border-rose-200 hover:text-rose-500 dark:border-slate-700 dark:hover:border-rose-900 dark:hover:text-rose-400"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>

                        <div className={`grid gap-3 ${gridClass}`}>
                            {columns.map((column) => {
                                if (column.type === 'select') {
                                    return (
                                        <SelectInput
                                            key={column.key}
                                            label={column.label}
                                            value={item[column.key]}
                                            options={column.options ?? []}
                                            hint={column.hint}
                                            onChange={(value) => update(index, column.key, value)}
                                        />
                                    );
                                }

                                if (column.type === 'textarea') {
                                    return (
                                        <TextAreaField
                                            key={column.key}
                                            label={column.label}
                                            rows={2}
                                            value={item[column.key]}
                                            placeholder={column.placeholder}
                                            hint={column.hint}
                                            onChange={(value) => update(index, column.key, value)}
                                        />
                                    );
                                }

                                return (
                                    <TextField
                                        key={column.key}
                                        label={column.label}
                                        value={item[column.key]}
                                        placeholder={column.placeholder}
                                        hint={column.hint}
                                        onChange={(value) => update(index, column.key, value)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <Button type="button" variant="outline" size="sm" leftIcon={<Plus size={14} />} onClick={() => onChange([...items, { ...emptyItem }])}>
                {addLabel}
            </Button>
        </div>
    );
}

interface PickOption {
    id: number;
    label: string;
    subtitle?: string;
    avatar_url?: string | null;
}

function IdPicker<T extends PickOption>({
    label,
    hint,
    options,
    selectedIds,
    onChange,
    addLabel,
    emptyHint,
}: {
    label: string;
    hint?: string;
    options: T[];
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    addLabel: string;
    emptyHint: string;
}) {
    const [pending, setPending] = useState('');
    const byId = new Map(options.map((option) => [option.id, option]));
    const available = options.filter((option) => !selectedIds.includes(option.id));

    const add = () => {
        const id = Number(pending);
        if (!id || selectedIds.includes(id)) {
            return;
        }

        onChange([...selectedIds, id]);
        setPending('');
    };

    const move = (index: number, step: number) => {
        const target = index + step;
        if (target < 0 || target >= selectedIds.length) {
            return;
        }

        const next = [...selectedIds];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    };

    return (
        <div className="space-y-2">
            <span className={labelClass}>{label}</span>
            {hint && <p className={hintClass}>{hint}</p>}

            {selectedIds.length === 0 ? (
                <p className="border border-dashed border-slate-300 p-3 text-xs text-slate-500 dark:border-slate-600 dark:text-slate-400">
                    {emptyHint}
                </p>
            ) : (
                <div className="space-y-2">
                    {selectedIds.map((id, index) => {
                        const option = byId.get(id);

                        return (
                            <div key={id} className="flex items-center gap-3 border border-slate-200 p-2.5 dark:border-slate-700">
                                <span className="w-5 shrink-0 text-center text-xs font-semibold text-slate-400">{index + 1}</span>
                                {option?.avatar_url ? (
                                    <img src={option.avatar_url} alt="" className="h-9 w-9 shrink-0 object-cover" />
                                ) : (
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-purple-100 text-xs font-semibold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                                        {(option?.label ?? '?').charAt(0).toUpperCase()}
                                    </span>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                                        {option?.label ?? `Unavailable (ID ${id})`}
                                    </p>
                                    {option?.subtitle && <p className="truncate text-xs text-slate-400 dark:text-slate-500">{option.subtitle}</p>}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        aria-label="Move up"
                                        disabled={index === 0}
                                        onClick={() => move(index, -1)}
                                        className="border border-slate-200 p-1.5 text-slate-500 transition-colors hover:border-purple-300 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-700"
                                    >
                                        <ArrowUp size={13} />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Move down"
                                        disabled={index === selectedIds.length - 1}
                                        onClick={() => move(index, 1)}
                                        className="border border-slate-200 p-1.5 text-slate-500 transition-colors hover:border-purple-300 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-700"
                                    >
                                        <ArrowDown size={13} />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Remove"
                                        onClick={() => onChange(selectedIds.filter((selectedId) => selectedId !== id))}
                                        className="border border-slate-200 p-1.5 text-slate-400 transition-colors hover:border-rose-200 hover:text-rose-500 dark:border-slate-700 dark:hover:border-rose-900 dark:hover:text-rose-400"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex-1">
                    <SelectInput
                        label={addLabel}
                        value={pending}
                        onChange={setPending}
                        options={[
                            { label: 'Choose an item…', value: '' },
                            ...available.map((option) => ({ label: option.label, value: String(option.id) })),
                        ]}
                    />
                </div>
                <div className="flex items-end">
                    <Button type="button" variant="outline" leftIcon={<Plus size={14} />} disabled={!pending} onClick={add}>
                        Add
                    </Button>
                </div>
            </div>
        </div>
    );
}

function StringListField({
    label,
    items,
    onChange,
    placeholder,
    hint,
}: {
    label: string;
    items: string[];
    onChange: (items: string[]) => void;
    placeholder?: string;
    hint?: string;
}) {
    const list = items ?? [];

    return (
        <div className="space-y-1.5">
            <span className={labelClass}>{label}</span>
            {hint && <p className={hintClass}>{hint}</p>}
            <div className="space-y-2">
                {list.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <input
                            className={inputClass}
                            value={item}
                            placeholder={placeholder}
                            onChange={(event) => {
                                const next = [...list];
                                next[index] = event.target.value;
                                onChange(next);
                            }}
                        />
                        <button
                            type="button"
                            aria-label="Remove item"
                            onClick={() => onChange(list.filter((_, i) => i !== index))}
                            className="shrink-0 border border-slate-200 p-2 text-slate-400 transition-colors hover:border-rose-200 hover:text-rose-500 dark:border-slate-700 dark:hover:border-rose-900 dark:hover:text-rose-400"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" leftIcon={<Plus size={14} />} onClick={() => onChange([...list, ''])}>
                    Add item
                </Button>
            </div>
        </div>
    );
}

function PhotoManager({
    photos,
    uploads,
    onRemovePhoto,
    onAddUploads,
    onRemoveUpload,
}: {
    photos: string[];
    uploads: PendingUpload[];
    onRemovePhoto: (index: number) => void;
    onAddUploads: (files: FileList | null) => void;
    onRemoveUpload: (index: number) => void;
}) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((url, index) => (
                    <div
                        key={`${url}-${index}`}
                        className="group relative aspect-video overflow-hidden border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-[#141416]"
                    >
                        <img src={url} alt={`Bento photo ${index + 1}`} className="h-full w-full object-cover" />
                        <button
                            type="button"
                            aria-label="Remove photo"
                            onClick={() => onRemovePhoto(index)}
                            className="absolute top-1.5 right-1.5 inline-flex items-center justify-center bg-black/60 p-1.5 text-white opacity-100 transition-opacity hover:bg-rose-600 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                ))}

                {uploads.map((upload, index) => (
                    <div
                        key={upload.preview}
                        className="group relative aspect-video overflow-hidden border border-dashed border-purple-400 bg-slate-100 dark:bg-[#141416]"
                    >
                        <img src={upload.preview} alt="New bento photo" className="h-full w-full object-cover" />
                        <span className="absolute bottom-1.5 left-1.5 bg-purple-600 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white">
                            NEW
                        </span>
                        <button
                            type="button"
                            aria-label="Remove new photo"
                            onClick={() => onRemoveUpload(index)}
                            className="absolute top-1.5 right-1.5 inline-flex items-center justify-center bg-black/60 p-1.5 text-white opacity-100 transition-opacity hover:bg-rose-600 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="space-y-1.5">
                <label className="inline-flex cursor-pointer items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-purple-400 hover:text-purple-700 dark:border-slate-600 dark:bg-[#141416] dark:text-slate-200 dark:hover:border-purple-500 dark:hover:text-purple-300">
                    <Plus size={14} />
                    Upload photos
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                            onAddUploads(event.target.files);
                            event.target.value = '';
                        }}
                    />
                </label>
                <p className={hintClass}>JPG, PNG, WEBP, or GIF. Max 4 MB per image. Uploaded images are saved when you submit the form.</p>
            </div>
        </div>
    );
}

function AvatarManager({
    avatars,
    uploads,
    onRemoveAvatar,
    onAddUploads,
    onRemoveUpload,
}: {
    avatars: string[];
    uploads: PendingUpload[];
    onRemoveAvatar: (index: number) => void;
    onAddUploads: (files: FileList | null, kind?: 'photo' | 'avatar') => void;
    onRemoveUpload: (index: number) => void;
}) {
    const avatarUploads = uploads.filter((upload) => (upload.kind ?? 'photo') === 'avatar');

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {avatars.map((url, index) => (
                    <div
                        key={`${url}-${index}`}
                        className="group relative aspect-square overflow-hidden border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-[#141416]"
                    >
                        <img src={url} alt={`Avatar ${index + 1}`} className="h-full w-full object-cover" />
                        <button
                            type="button"
                            aria-label="Remove avatar"
                            onClick={() => onRemoveAvatar(index)}
                            className="absolute top-1.5 right-1.5 inline-flex items-center justify-center bg-black/60 p-1.5 text-white opacity-100 transition-opacity hover:bg-rose-600 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                ))}

                {avatarUploads.map((upload, index) => (
                    <div
                        key={upload.preview}
                        className="group relative aspect-square overflow-hidden border border-dashed border-purple-400 bg-slate-100 dark:bg-[#141416]"
                    >
                        <img src={upload.preview} alt="New avatar" className="h-full w-full object-cover" />
                        <span className="absolute bottom-1.5 left-1.5 bg-purple-600 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white">
                            NEW
                        </span>
                        <button
                            type="button"
                            aria-label="Remove new avatar"
                            onClick={() => onRemoveUpload(index)}
                            className="absolute top-1.5 right-1.5 inline-flex items-center justify-center bg-black/60 p-1.5 text-white opacity-100 transition-opacity hover:bg-rose-600 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="space-y-1.5">
                <label className="inline-flex cursor-pointer items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-purple-400 hover:text-purple-700 dark:border-slate-600 dark:bg-[#141416] dark:text-slate-200 dark:hover:border-purple-500 dark:hover:text-purple-300">
                    <Plus size={14} />
                    Upload avatars
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                            onAddUploads(event.target.files, 'avatar');
                            event.target.value = '';
                        }}
                    />
                </label>
                <p className={hintClass}>JPG, PNG, WEBP, or GIF. Max 4 MB per image. Upload an image or paste an avatar link in the list above.</p>
            </div>
        </div>
    );
}

export default function LandingSettingsPage({
    section,
    label,
    content,
    testimonials = [],
    instructorOptions = [],
    certificateOptions = [],
}: LandingSettingsPageProps) {
    const [data, setData] = useState<LandingContent>(content ?? {});
    const [saving, setSaving] = useState(false);
    const [uploads, setUploads] = useState<PendingUpload[]>([]);

    // Keep the form in sync after a save (e.g. newly uploaded photo URLs).
    useEffect(() => {
        setData(content ?? {});
    }, [content]);

    const addUploads = (files: FileList | null, kind: 'photo' | 'avatar' = 'photo') => {
        if (!files) {
            return;
        }

        const next = Array.from(files).map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            kind,
        }));

        setUploads((prev) => [...prev, ...next]);
    };

    const removeUpload = (index: number) => {
        setUploads((prev) => {
            const target = prev[index];

            if (target) {
                URL.revokeObjectURL(target.preview);
            }

            return prev.filter((_, i) => i !== index);
        });
    };

    const addPaymentLogo = (key: string, file: File) => {
        const preview = URL.createObjectURL(file);

        setUploads((prev) => {
            const existing = prev.find((upload) => upload.kind === 'payment-logo' && upload.key === key);

            if (existing) {
                URL.revokeObjectURL(existing.preview);
            }

            return [
                ...prev.filter((upload) => !(upload.kind === 'payment-logo' && upload.key === key)),
                { file, preview, kind: 'payment-logo', key },
            ];
        });
    };

    const removePaymentLogo = (key: string) => {
        setUploads((prev) => {
            prev.forEach((upload) => {
                if (upload.kind === 'payment-logo' && upload.key === key) {
                    URL.revokeObjectURL(upload.preview);
                }
            });

            return prev.filter((upload) => !(upload.kind === 'payment-logo' && upload.key === key));
        });
    };

    const clearUploads = () => {
        setUploads((prev) => {
            prev.forEach((upload) => URL.revokeObjectURL(upload.preview));
            return [];
        });
    };

    const set: SetValue = (key, value) => setData((prev) => ({ ...prev, [key]: value }));

    const list: ListGetter = <T,>(key: string): T[] => (Array.isArray(data[key]) ? (data[key] as T[]) : []);

    const updateItem: UpdateItem = (key, index, field, value) => {
        setData((prev) => {
            const items = [...(Array.isArray(prev[key]) ? (prev[key] as Record<string, unknown>[]) : [])];
            items[index] = { ...items[index], [field]: value };
            return { ...prev, [key]: items };
        });
    };

    const removeItem = (key: string, index: number) => {
        setData((prev) => ({
            ...prev,
            [key]: (Array.isArray(prev[key]) ? (prev[key] as unknown[]) : []).filter((_: unknown, i: number) => i !== index),
        }));
    };

    const addItem: AddItem = (key, item) => {
        setData((prev) => ({
            ...prev,
            [key]: [...(Array.isArray(prev[key]) ? (prev[key] as unknown[]) : []), item],
        }));
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        const url = `/admin/settings/landing/${section}`;
        const options = {
            preserveScroll: true,
            onStart: () => setSaving(true),
            onFinish: () => setSaving(false),
            onSuccess: () => clearUploads(),
        };

        const photoUploads = uploads.filter((upload) => (upload.kind ?? 'photo') === 'photo');
        const avatarUploads = uploads.filter((upload) => (upload.kind ?? 'photo') === 'avatar');
        const paymentLogoUploads = uploads.filter((upload) => upload.kind === 'payment-logo' && upload.key);
        const hasHeroUploads = section === 'hero' && (photoUploads.length > 0 || avatarUploads.length > 0);
        const hasPaymentLogoUploads = section === 'trust' && paymentLogoUploads.length > 0;

        if (hasHeroUploads || hasPaymentLogoUploads) {
            // Inertia only supports file uploads on POST, so spoof PUT.
            const payload = {
                _method: 'put',
                content: data as FormDataConvertible,
            };

            if (hasHeroUploads) {
                Object.assign(payload, {
                    photos: photoUploads.map((upload) => upload.file),
                    avatars: avatarUploads.map((upload) => upload.file),
                });
            }

            if (hasPaymentLogoUploads) {
                Object.assign(payload, {
                    payment_logo_files: Object.fromEntries(paymentLogoUploads.map((upload) => [upload.key as string, upload.file])),
                });
            }

            router.post(url, payload, { ...options, forceFormData: true });

            return;
        }

        router.put(url, { content: data as FormDataConvertible }, options);
    };

    return (
        <>
            <Head title={`Landing · ${label}`} />

            <div className="mx-auto space-y-6 pb-24">
                <PageHeader
                    breadcrumbs={[{ label: 'Landing Page' }, { label }]}
                    title={`Landing · ${label}`}
                    description="Edit this section’s content. Changes appear on the landing page immediately."
                    actions={
                        <Link href="/" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                            <Button variant="outline" size="sm" rightIcon={<ExternalLink size={14} />} className="w-full justify-center sm:w-auto">
                                Preview
                            </Button>
                        </Link>
                    }
                />

                <nav className="flex flex-wrap gap-2">
                    {SECTIONS.map((item) => (
                        <Link
                            key={item.key}
                            href={`/admin/settings/landing/${item.key}`}
                            className={
                                item.key === section
                                    ? 'border border-purple-700 bg-purple-700 px-3 py-1.5 text-xs font-semibold text-white'
                                    : 'border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-purple-300 hover:text-purple-700 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-300 dark:hover:border-purple-800 dark:hover:text-purple-300'
                            }
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <form onSubmit={submit} className="space-y-6">
                    <Panel title="Section visibility" hint="Hidden sections are removed from the public landing page and their data is not loaded.">
                        <ToggleField
                            label={`Show ${label} on the landing page`}
                            checked={data.show !== false}
                            onChange={(value) => set('show', value)}
                            hint="Turn this off to hide the entire section without deleting its content."
                        />
                    </Panel>

                    {section === 'hero' && (
                        <HeroForm data={data} set={set} list={list} uploads={uploads} onAddUploads={addUploads} onRemoveUpload={removeUpload} />
                    )}

                    {section === 'about' && (
                        <AboutForm data={data} set={set} list={list} updateItem={updateItem} removeItem={removeItem} addItem={addItem} />
                    )}

                    {section === 'courses' && <CoursesForm data={data} set={set} />}

                    {section === 'career' && <CareerForm data={data} set={set} />}

                    {section === 'instructor' && <InstructorForm data={data} set={set} list={list} options={instructorOptions} />}

                    {section === 'how_it_works' && <HowItWorksForm data={data} set={set} list={list} />}

                    {section === 'benefit' && <BenefitForm data={data} set={set} list={list} />}

                    {section === 'certificate' && <CertificateForm data={data} set={set} list={list} options={certificateOptions} />}

                    {section === 'testimonial' && <TestimonialForm data={data} set={set} testimonials={testimonials} />}

                    {section === 'faq' && <FaqForm data={data} set={set} list={list} />}

                    {section === 'trust' && (
                        <TrustForm
                            data={data}
                            set={set}
                            list={list}
                            uploads={uploads}
                            onAddPaymentLogo={addPaymentLogo}
                            onRemovePaymentLogo={removePaymentLogo}
                        />
                    )}

                    {section === 'cta' && <CtaForm data={data} set={set} />}

                    {section === 'footer' && (
                        <FooterForm data={data} set={set} list={list} updateItem={updateItem} removeItem={removeItem} addItem={addItem} />
                    )}

                    <div className="sticky bottom-4 flex flex-col items-stretch justify-between gap-3 border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center dark:border-slate-700 dark:bg-[#1e1f24]/95">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Changes will be saved for the <strong>{label}</strong> section.
                        </p>
                        <Button
                            type="submit"
                            isLoading={saving}
                            leftIcon={<Save size={16} />}
                            className="w-full justify-center sm:w-auto sm:shrink-0"
                        >
                            Save changes
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

function HeroForm({
    data,
    set,
    list,
    uploads,
    onAddUploads,
    onRemoveUpload,
}: {
    data: LandingContent;
    set: SetValue;
    list: ListGetter;
    uploads: PendingUpload[];
    onAddUploads: (files: FileList | null, kind?: 'photo' | 'avatar') => void;
    onRemoveUpload: (index: number) => void;
}) {
    return (
        <>
            <Panel title="Hero content">
                <TextField label="Badge" value={data.badge} onChange={(value) => set('badge', value)} />
                <TextField label="Title (first line)" value={data.title_lead} onChange={(value) => set('title_lead', value)} />
                <TextField
                    label="Title highlight"
                    value={data.title_highlight}
                    onChange={(value) => set('title_highlight', value)}
                    hint="Rendered with the purple highlight and glow."
                />
                <TextAreaField label="Subtitle" value={data.subtitle} onChange={(value) => set('subtitle', value)} />
            </Panel>

            <Panel title="Buttons">
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Primary label" value={data.primary_label} onChange={(value) => set('primary_label', value)} />
                    <TextField label="Primary link" value={data.primary_href} onChange={(value) => set('primary_href', value)} />
                    <TextField label="Secondary label" value={data.secondary_label} onChange={(value) => set('secondary_label', value)} />
                    <TextField label="Secondary link" value={data.secondary_href} onChange={(value) => set('secondary_href', value)} />
                </div>
            </Panel>

            <Panel title="Social proof">
                <div className="grid gap-4 sm:grid-cols-3">
                    <TextField label="Rating" value={data.rating} onChange={(value) => set('rating', value)} />
                    <TextField label="Learners label" value={data.learners_label} onChange={(value) => set('learners_label', value)} />
                    <TextField label="Learners suffix" value={data.learners_suffix} onChange={(value) => set('learners_suffix', value)} />
                </div>
                <StringListField
                    label="Avatar URLs"
                    items={list<string>('avatars')}
                    onChange={(items) => set('avatars', items)}
                    placeholder="https://..."
                />
                <AvatarManager
                    avatars={list<string>('avatars')}
                    uploads={uploads}
                    onRemoveAvatar={(index) =>
                        set(
                            'avatars',
                            list<string>('avatars').filter((_, i) => i !== index),
                        )
                    }
                    onAddUploads={onAddUploads}
                    onRemoveUpload={onRemoveUpload}
                />
            </Panel>

            <Panel title="Bento photos" hint="Upload images directly. The first five fill the bento grid; the first image is the large one.">
                <PhotoManager
                    photos={list<string>('photos')}
                    uploads={uploads}
                    onRemovePhoto={(index) =>
                        set(
                            'photos',
                            list<string>('photos').filter((_, i) => i !== index),
                        )
                    }
                    onAddUploads={onAddUploads}
                    onRemoveUpload={onRemoveUpload}
                />
            </Panel>
        </>
    );
}

function AboutForm({
    data,
    set,
    list,
    updateItem,
    removeItem,
    addItem,
}: {
    data: LandingContent;
    set: SetValue;
    list: ListGetter;
    updateItem: UpdateItem;
    removeItem: (key: string, index: number) => void;
    addItem: AddItem;
}) {
    return (
        <>
            <Panel title="Story">
                <div className="grid gap-4 sm:grid-cols-3">
                    <TextField label="Title lead" value={data.title_lead} onChange={(value) => set('title_lead', value)} />
                    <TextField label="Title highlight" value={data.title_highlight} onChange={(value) => set('title_highlight', value)} />
                    <TextField label="Title tail" value={data.title_tail} onChange={(value) => set('title_tail', value)} />
                </div>
                <TextAreaField
                    label="Paragraph 1"
                    value={data.paragraph_1}
                    onChange={(value) => set('paragraph_1', value)}
                    hint="Use {brand} to insert the app name."
                />
                <TextAreaField
                    label="Paragraph 2"
                    value={data.paragraph_2}
                    onChange={(value) => set('paragraph_2', value)}
                    hint="Use {brand} to insert the app name."
                />
                <StringListField
                    label="Highlights"
                    items={list<string>('highlights')}
                    onChange={(items) => set('highlights', items)}
                    placeholder="Highlight text"
                />
            </Panel>

            <Panel title="Numbers panel">
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Eyebrow" value={data.eyebrow} onChange={(value) => set('eyebrow', value)} />
                    <TextField label="Since label" value={data.since_label} onChange={(value) => set('since_label', value)} />
                </div>

                <div className="space-y-2">
                    <span className={labelClass}>Stats</span>
                    <p className={hintClass}>Values can mix digits with suffixes, e.g. 50K+ or 98%.</p>

                    {list<StatItem>('stats').map((stat, index) => (
                        <div key={index} className="flex items-end gap-2">
                            <div className="w-28">
                                <TextField label="Value" value={stat.value} onChange={(value) => updateItem('stats', index, 'value', value)} />
                            </div>
                            <div className="flex-1">
                                <TextField label="Label" value={stat.label} onChange={(value) => updateItem('stats', index, 'label', value)} />
                            </div>
                            <button
                                type="button"
                                aria-label="Remove stat"
                                onClick={() => removeItem('stats', index)}
                                className="mb-0.5 shrink-0 border border-slate-200 p-2 text-slate-400 transition-colors hover:border-rose-200 hover:text-rose-500 dark:border-slate-700 dark:hover:border-rose-900 dark:hover:text-rose-400"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        leftIcon={<Plus size={14} />}
                        onClick={() => addItem('stats', { value: '', label: '' })}
                    >
                        Add stat
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="CTA label" value={data.cta_label} onChange={(value) => set('cta_label', value)} />
                    <TextField label="CTA link" value={data.cta_href} onChange={(value) => set('cta_href', value)} />
                </div>
            </Panel>
        </>
    );
}

function CoursesForm({ data, set }: { data: LandingContent; set: SetValue }) {
    return (
        <Panel title="Courses section">
            <TextField label="Badge" value={data.badge} onChange={(value) => set('badge', value)} />
            <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Title lead" value={data.title_lead} onChange={(value) => set('title_lead', value)} />
                <TextField label="Title highlight" value={data.title_highlight} onChange={(value) => set('title_highlight', value)} />
            </div>
            <TextAreaField label="Description" value={data.description} onChange={(value) => set('description', value)} />
            <div className="grid gap-4 sm:grid-cols-3">
                <NumberField label="Courses shown" value={data.limit} onChange={(value) => set('limit', value)} hint="1 – 24 courses." />
                <TextField label="CTA label" value={data.cta_label} onChange={(value) => set('cta_label', value)} />
                <TextField label="CTA link" value={data.cta_href} onChange={(value) => set('cta_href', value)} />
            </div>
        </Panel>
    );
}

function CareerForm({ data, set }: { data: LandingContent; set: SetValue }) {
    return (
        <Panel title="Career section" hint="Categories shown here come from the Categories menu.">
            <TextField label="Badge" value={data.badge} onChange={(value) => set('badge', value)} />
            <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Title lead" value={data.title_lead} onChange={(value) => set('title_lead', value)} />
                <TextField label="Title highlight" value={data.title_highlight} onChange={(value) => set('title_highlight', value)} />
            </div>
            <TextAreaField label="Description" value={data.description} onChange={(value) => set('description', value)} />
            <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="CTA label" value={data.cta_label} onChange={(value) => set('cta_label', value)} />
                <TextField label="CTA link" value={data.cta_href} onChange={(value) => set('cta_href', value)} />
            </div>
        </Panel>
    );
}

function InstructorForm({ data, set, list, options }: { data: LandingContent; set: SetValue; list: ListGetter; options: InstructorOption[] }) {
    const mode = String(data.mode ?? 'selected');
    const selectedIds = list<number>('selected_ids');

    return (
        <>
            <Panel title="Instructor section">
                <TextField label="Badge" value={data.badge} onChange={(value) => set('badge', value)} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Title lead" value={data.title_lead} onChange={(value) => set('title_lead', value)} />
                    <TextField label="Title highlight" value={data.title_highlight} onChange={(value) => set('title_highlight', value)} />
                </div>
                <TextAreaField label="Description" value={data.description} onChange={(value) => set('description', value)} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="CTA label" value={data.cta_label} onChange={(value) => set('cta_label', value)} />
                    <TextField label="CTA link" value={data.cta_href} onChange={(value) => set('cta_href', value)} />
                </div>
            </Panel>

            <Panel
                title="Instructor data source"
                hint="Names, avatars, bios, course counts and student totals always come from real instructor accounts."
            >
                <SelectInput
                    label="Show"
                    value={mode}
                    onChange={(value) => {
                        set('mode', value);
                        if (value === 'all' && data.sort === 'selected') {
                            set('sort', 'courses');
                        }
                    }}
                    options={[
                        { label: 'Selected instructors', value: 'selected' },
                        { label: 'All instructors', value: 'all' },
                    ]}
                    hint="An empty selection automatically falls back to all instructors."
                />

                {mode === 'selected' && (
                    <IdPicker
                        label="Selected instructors"
                        hint="Order here is preserved when sorting is set to Selected order."
                        options={options.map((option) => ({
                            id: option.id,
                            label: option.name,
                            subtitle: `${option.headline || 'Instructor'} · ${option.courses_count} published course${option.courses_count === 1 ? '' : 's'}`,
                            avatar_url: option.avatar_url,
                        }))}
                        selectedIds={selectedIds}
                        onChange={(ids) => set('selected_ids', ids)}
                        addLabel="Add instructor"
                        emptyHint="No instructors selected yet — every real instructor will be shown automatically."
                    />
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <SelectInput
                        label="Sort by"
                        value={data.sort}
                        onChange={(value) => set('sort', value)}
                        options={
                            mode === 'selected'
                                ? [
                                      { label: 'Selected order', value: 'selected' },
                                      { label: 'Most courses', value: 'courses' },
                                      { label: 'Most students', value: 'students' },
                                      { label: 'Name', value: 'name' },
                                  ]
                                : [
                                      { label: 'Most courses', value: 'courses' },
                                      { label: 'Most students', value: 'students' },
                                      { label: 'Name', value: 'name' },
                                  ]
                        }
                    />
                    <NumberField label="Instructors shown" value={data.limit} onChange={(value) => set('limit', value)} min={1} max={24} />
                </div>

                <TextField
                    label="Fallback headline"
                    value={data.default_role}
                    onChange={(value) => set('default_role', value)}
                    hint="Shown as the instructor role when their profile headline is empty."
                />
            </Panel>
        </>
    );
}

function HowItWorksForm({ data, set, list }: { data: LandingContent; set: SetValue; list: ListGetter }) {
    return (
        <>
            <Panel title="How it works section">
                <TextField label="Badge" value={data.badge} onChange={(value) => set('badge', value)} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Title lead" value={data.title_lead} onChange={(value) => set('title_lead', value)} />
                    <TextField label="Title highlight" value={data.title_highlight} onChange={(value) => set('title_highlight', value)} />
                </div>
                <TextAreaField label="Description" value={data.description} onChange={(value) => set('description', value)} />
                <TextField label="Side note" value={data.note} onChange={(value) => set('note', value)} />
            </Panel>

            <Panel title="Steps" hint="Each step is animated as learners scroll through the timeline.">
                <RepeaterField
                    label="Journey steps"
                    items={list<Record<string, unknown>>('steps')}
                    onChange={(items) => set('steps', items)}
                    addLabel="Add step"
                    emptyItem={{ title: '', description: '', icon: 'search' }}
                    columns={[
                        { key: 'title', label: 'Title' },
                        { key: 'description', label: 'Description', type: 'textarea' },
                        { key: 'icon', label: 'Icon', type: 'select', options: STEP_ICON_OPTIONS },
                    ]}
                />
            </Panel>
        </>
    );
}

function BenefitForm({ data, set, list }: { data: LandingContent; set: SetValue; list: ListGetter }) {
    return (
        <>
            <Panel title="Benefits section">
                <TextField label="Badge" value={data.badge} onChange={(value) => set('badge', value)} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Title lead" value={data.title_lead} onChange={(value) => set('title_lead', value)} />
                    <TextField label="Title highlight" value={data.title_highlight} onChange={(value) => set('title_highlight', value)} />
                </div>
                <TextAreaField label="Description" value={data.description} onChange={(value) => set('description', value)} />
                <StringListField
                    label="Audiences"
                    items={list<string>('audiences')}
                    onChange={(items) => set('audiences', items)}
                    placeholder="e.g. Career switchers"
                />
            </Panel>

            <Panel title="Benefit cards">
                <RepeaterField
                    label="Benefits"
                    items={list<Record<string, unknown>>('benefits')}
                    onChange={(items) => set('benefits', items)}
                    addLabel="Add benefit"
                    emptyItem={{ title: '', description: '', icon: 'sparkles' }}
                    columns={[
                        { key: 'title', label: 'Title' },
                        { key: 'description', label: 'Description', type: 'textarea' },
                        { key: 'icon', label: 'Icon', type: 'select', options: BENEFIT_ICON_OPTIONS },
                    ]}
                />
            </Panel>
        </>
    );
}

function CertificateForm({ data, set, list, options }: { data: LandingContent; set: SetValue; list: ListGetter; options: CertificateOption[] }) {
    const mode = String(data.mode ?? 'latest');
    const featuredIds = list<number>('featured_ids');

    return (
        <>
            <Panel title="Certificate section">
                <TextField label="Badge" value={data.badge} onChange={(value) => set('badge', value)} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Title lead" value={data.title_lead} onChange={(value) => set('title_lead', value)} />
                    <TextField label="Title highlight" value={data.title_highlight} onChange={(value) => set('title_highlight', value)} />
                </div>
                <TextAreaField label="Description" value={data.description} onChange={(value) => set('description', value)} />
                <StringListField
                    label="Highlights"
                    items={list<string>('points')}
                    onChange={(items) => set('points', items)}
                    placeholder="e.g. Downloadable PDF, ready for LinkedIn"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="CTA label" value={data.cta_label} onChange={(value) => set('cta_label', value)} />
                    <TextField label="CTA link" value={data.cta_href} onChange={(value) => set('cta_href', value)} />
                </div>
            </Panel>

            <Panel title="Certificate data source" hint="Only real, verifiable certificates are shown publicly.">
                <SelectInput
                    label="Show"
                    value={mode}
                    onChange={(value) => set('mode', value)}
                    options={[
                        { label: 'Latest issued certificates', value: 'latest' },
                        { label: 'Featured certificates', value: 'featured' },
                    ]}
                />

                {mode === 'featured' && (
                    <IdPicker
                        label="Featured certificates"
                        hint="Order here is preserved in the showcase."
                        options={options.map((option) => ({
                            id: option.id,
                            label: `${option.student_name} — ${option.course_title}`,
                            subtitle: `${option.certificate_number} · ${option.issued_at}`,
                        }))}
                        selectedIds={featuredIds}
                        onChange={(ids) => set('featured_ids', ids)}
                        addLabel="Add certificate"
                        emptyHint="No certificates selected — the latest issued certificates will be shown instead."
                    />
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <NumberField label="Certificates shown" value={data.limit} onChange={(value) => set('limit', value)} min={1} max={12} />
                    <NumberField
                        label="Rotate every (seconds)"
                        value={data.rotate_seconds}
                        onChange={(value) => set('rotate_seconds', value)}
                        min={2}
                        max={60}
                    />
                </div>

                <ToggleField
                    label="Auto-rotate certificates"
                    checked={data.rotate !== false}
                    onChange={(value) => set('rotate', value)}
                    hint="Visitors can still switch certificates manually with the dots."
                />

                <ToggleField
                    label="Show a labelled sample when empty"
                    checked={data.show_sample_when_empty !== false}
                    onChange={(value) => set('show_sample_when_empty', value)}
                    hint="Useful before the first certificate has been issued. The preview is clearly marked as a sample."
                />
            </Panel>

            <Panel
                title="Issued certificates"
                hint="Real certificates available for the showcase. Soft-deleted learners and courses are excluded automatically."
            >
                {options.length > 0 ? (
                    <div className="space-y-2">
                        {options.map((option) => (
                            <div
                                key={option.id}
                                className="flex flex-col justify-between gap-1 border border-slate-200 p-3 text-xs sm:flex-row sm:items-center dark:border-slate-700"
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                                        {option.student_name} — {option.course_title}
                                    </p>
                                    <p className="truncate text-slate-400 dark:text-slate-500">
                                        {option.certificate_number} · {option.issued_at}
                                    </p>
                                </div>
                                <span className="shrink-0 text-purple-600 dark:text-purple-400">#{option.id}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No certificates have been issued yet.</p>
                )}
            </Panel>
        </>
    );
}

function FaqForm({ data, set, list }: { data: LandingContent; set: SetValue; list: ListGetter }) {
    return (
        <>
            <Panel title="FAQ section">
                <TextField label="Badge" value={data.badge} onChange={(value) => set('badge', value)} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Title lead" value={data.title_lead} onChange={(value) => set('title_lead', value)} />
                    <TextField label="Title highlight" value={data.title_highlight} onChange={(value) => set('title_highlight', value)} />
                </div>
                <TextAreaField label="Description" value={data.description} onChange={(value) => set('description', value)} />
            </Panel>

            <Panel title="Questions">
                <RepeaterField
                    label="FAQ items"
                    items={list<Record<string, unknown>>('items')}
                    onChange={(items) => set('items', items)}
                    addLabel="Add question"
                    emptyItem={{ question: '', answer: '' }}
                    columns={[
                        { key: 'question', label: 'Question' },
                        { key: 'answer', label: 'Answer', type: 'textarea' },
                    ]}
                />
            </Panel>
        </>
    );
}

function TrustForm({
    data,
    set,
    list,
    uploads,
    onAddPaymentLogo,
    onRemovePaymentLogo,
}: {
    data: LandingContent;
    set: SetValue;
    list: ListGetter;
    uploads: PendingUpload[];
    onAddPaymentLogo: (key: string, file: File) => void;
    onRemovePaymentLogo: (key: string) => void;
}) {
    const methods = list<string>('payment_methods');
    const rawLogos = data.payment_logos;
    const logos: Record<string, string> =
        rawLogos && typeof rawLogos === 'object' && !Array.isArray(rawLogos) ? (rawLogos as Record<string, string>) : {};

    const setLogo = (method: string, url: string | null) => {
        const key = normalizePaymentMethodKey(method);
        const next = { ...logos };

        if (url) {
            next[key] = url;
        } else {
            delete next[key];
        }

        set('payment_logos', next);
    };

    return (
        <Panel title="Trust bar">
            <div className="space-y-1.5">
                <span className={labelClass}>Payment methods</span>
                <p className={hintClass}>
                    Each method gets a compact logo badge above the footer. Known methods are filled in automatically — upload an image here to
                    replace any logo.
                </p>
                <div className="space-y-3">
                    {methods.map((method, index) => {
                        const key = normalizePaymentMethodKey(method);
                        const pending = uploads.find((upload) => upload.kind === 'payment-logo' && upload.key === key);
                        const logoSrc = pending?.preview ?? paymentLogoSrc(method, logos);
                        const hasCustom = Boolean(pending || logos[key]);

                        return (
                            <div key={index} className="space-y-3 border border-slate-200 p-3 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                    <input
                                        className={inputClass}
                                        value={method}
                                        placeholder="e.g. QRIS"
                                        aria-label={`Payment method ${index + 1}`}
                                        onChange={(event) => {
                                            const next = [...methods];
                                            next[index] = event.target.value;
                                            set('payment_methods', next);
                                        }}
                                    />
                                    <button
                                        type="button"
                                        aria-label="Remove payment method"
                                        onClick={() =>
                                            set(
                                                'payment_methods',
                                                methods.filter((_, i) => i !== index),
                                            )
                                        }
                                        className="shrink-0 border border-slate-200 p-2 text-slate-400 transition-colors hover:border-rose-200 hover:text-rose-500 dark:border-slate-700 dark:hover:border-rose-900 dark:hover:text-rose-400"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex h-10 min-w-[76px] items-center justify-center border border-slate-200 bg-white px-2 dark:border-slate-700 dark:bg-[#141416]">
                                        {logoSrc ? (
                                            <img src={logoSrc} alt="" className="max-h-6 max-w-[100px] object-contain" />
                                        ) : (
                                            <span className="text-[11px] text-slate-400">{method || 'No label'}</span>
                                        )}
                                    </div>

                                    <label className="cursor-pointer border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-purple-400 hover:text-purple-700 dark:border-slate-600 dark:text-slate-300 dark:hover:border-purple-700 dark:hover:text-purple-300">
                                        {hasCustom ? 'Replace logo' : 'Upload logo'}
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            className="hidden"
                                            onChange={(event) => {
                                                const file = event.target.files?.[0];
                                                if (file && key) {
                                                    onAddPaymentLogo(key, file);
                                                }
                                                event.target.value = '';
                                            }}
                                        />
                                    </label>

                                    {hasCustom && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (pending) {
                                                    onRemovePaymentLogo(key);
                                                }
                                                if (logos[key]) {
                                                    setLogo(method, null);
                                                }
                                            }}
                                            className="border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-rose-200 hover:text-rose-500 dark:border-slate-700 dark:text-slate-400 dark:hover:border-rose-900 dark:hover:text-rose-400"
                                        >
                                            Remove logo
                                        </button>
                                    )}

                                    {pending ? (
                                        <span className={hintClass}>Ready to save.</span>
                                    ) : logos[key] ? (
                                        <span className={hintClass}>Custom logo active.</span>
                                    ) : paymentLogoSrc(method) ? (
                                        <span className={hintClass}>Using the built-in logo.</span>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<Plus size={14} />}
                    onClick={() => set('payment_methods', [...methods, ''])}
                >
                    Add item
                </Button>
                <p className={hintClass}>PNG, JPG, or WEBP. Max 2 MB per logo. Save the section to upload the selected images.</p>
            </div>

            <StringListField
                label="Guarantees"
                items={list<string>('guarantees')}
                onChange={(items) => set('guarantees', items)}
                placeholder="e.g. Encrypted payment gateway"
            />
        </Panel>
    );
}

function TestimonialForm({ data, set, testimonials }: { data: LandingContent; set: SetValue; testimonials: TestimonialItem[] }) {
    return (
        <>
            <Panel title="Testimonial section">
                <TextField label="Badge" value={data.badge} onChange={(value) => set('badge', value)} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Title lead" value={data.title_lead} onChange={(value) => set('title_lead', value)} />
                    <TextField label="Title highlight" value={data.title_highlight} onChange={(value) => set('title_highlight', value)} />
                </div>
                <TextAreaField label="Description" value={data.description} onChange={(value) => set('description', value)} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <NumberField label="Max testimonials" value={data.limit} onChange={(value) => set('limit', value)} min={1} max={24} />
                    <NumberField
                        label="Minimum rating"
                        value={data.min_rating}
                        onChange={(value) => set('min_rating', value)}
                        min={1}
                        max={5}
                        hint="Only approved reviews with at least this rating are shown."
                    />
                </div>
            </Panel>

            <Panel
                title="Live preview from reviews"
                hint="Testimonials are taken automatically from approved course reviews — no manual copy needed."
            >
                <div className="flex flex-wrap items-center justify-between gap-3 border border-purple-200 bg-purple-50 p-3 text-xs text-purple-900 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-200">
                    <span>
                        {testimonials.length} approved review{testimonials.length === 1 ? '' : 's'} will appear on the landing page.
                    </span>
                    <Link href="/admin/reviews" className="font-semibold underline-offset-2 hover:underline">
                        Moderate reviews →
                    </Link>
                </div>

                {testimonials.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {testimonials.map((item) => (
                            <div key={item.id} className="space-y-2 border border-slate-200 p-3 dark:border-slate-700">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.name}</span>
                                    <span className="text-xs font-medium text-amber-500">{item.rating} / 5 ★</span>
                                </div>
                                <p className="line-clamp-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.comment}</p>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500">{item.role}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No approved reviews match the current minimum rating yet.</p>
                )}
            </Panel>
        </>
    );
}

function CtaForm({ data, set }: { data: LandingContent; set: SetValue }) {
    return (
        <Panel title="Footer CTA">
            <div className="grid gap-4 sm:grid-cols-3">
                <TextField label="Title line 1" value={data.title_line_1} onChange={(value) => set('title_line_1', value)} />
                <TextField label="Title line 2" value={data.title_line_2} onChange={(value) => set('title_line_2', value)} />
                <TextField label="Title highlight" value={data.title_highlight} onChange={(value) => set('title_highlight', value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Primary label" value={data.primary_label} onChange={(value) => set('primary_label', value)} />
                <TextField label="Primary link" value={data.primary_href} onChange={(value) => set('primary_href', value)} />
                <TextField label="Secondary label" value={data.secondary_label} onChange={(value) => set('secondary_label', value)} />
                <TextField label="Secondary link" value={data.secondary_href} onChange={(value) => set('secondary_href', value)} />
            </div>
        </Panel>
    );
}

function FooterForm({
    data,
    set,
    list,
    updateItem,
    removeItem,
    addItem,
}: {
    data: LandingContent;
    set: SetValue;
    list: ListGetter;
    updateItem: UpdateItem;
    removeItem: (key: string, index: number) => void;
    addItem: AddItem;
}) {
    const columns: FooterColumn[] = list<FooterColumn>('columns');
    const socials: SocialItem[] = list<SocialItem>('socials');
    const legal: LegalItem[] = list<LegalItem>('legal');

    return (
        <>
            <Panel title="Contact">
                <TextAreaField label="Address" value={data.address} onChange={(value) => set('address', value)} rows={2} />
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label="Phone" value={data.phone} onChange={(value) => set('phone', value)} />
                    <TextField
                        label="Email"
                        value={data.email}
                        onChange={(value) => set('email', value)}
                        hint="Leave empty to use the brand contact email from General settings."
                    />
                </div>
            </Panel>

            <Panel title="Link columns" hint="Each column has a heading and a list of links.">
                <div className="space-y-4">
                    {columns.map((column, columnIndex) => (
                        <div key={columnIndex} className="space-y-3 border border-slate-200 p-4 dark:border-slate-700">
                            <div className="flex items-end gap-2">
                                <div className="flex-1">
                                    <TextField
                                        label={`Column ${columnIndex + 1} title`}
                                        value={column.title}
                                        onChange={(value) => updateItem('columns', columnIndex, 'title', value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    aria-label="Remove column"
                                    onClick={() => removeItem('columns', columnIndex)}
                                    className="mb-0.5 shrink-0 border border-slate-200 p-2 text-slate-400 transition-colors hover:border-rose-200 hover:text-rose-500 dark:border-slate-700 dark:hover:border-rose-900 dark:hover:text-rose-400"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {(Array.isArray(column.links) ? column.links : []).map((link, linkIndex) => (
                                    <div key={linkIndex} className="flex items-end gap-2">
                                        <div className="flex-1">
                                            <TextField
                                                label="Label"
                                                value={link.label}
                                                onChange={(value) => {
                                                    const next = [...columns];
                                                    const links = [...(Array.isArray(column.links) ? column.links : [])];
                                                    links[linkIndex] = { ...links[linkIndex], label: value };
                                                    next[columnIndex] = { ...column, links };
                                                    set('columns', next);
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <TextField
                                                label="Link"
                                                value={link.href}
                                                onChange={(value) => {
                                                    const next = [...columns];
                                                    const links = [...(Array.isArray(column.links) ? column.links : [])];
                                                    links[linkIndex] = { ...links[linkIndex], href: value };
                                                    next[columnIndex] = { ...column, links };
                                                    set('columns', next);
                                                }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            aria-label="Remove link"
                                            onClick={() => {
                                                const next = [...columns];
                                                const links = (Array.isArray(column.links) ? column.links : []).filter(
                                                    (_: unknown, i: number) => i !== linkIndex,
                                                );
                                                next[columnIndex] = { ...column, links };
                                                set('columns', next);
                                            }}
                                            className="mb-0.5 shrink-0 border border-slate-200 p-2 text-slate-400 transition-colors hover:border-rose-200 hover:text-rose-500 dark:border-slate-700 dark:hover:border-rose-900 dark:hover:text-rose-400"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    leftIcon={<Plus size={14} />}
                                    onClick={() => {
                                        const next = [...columns];
                                        const links = [...(Array.isArray(column.links) ? column.links : []), { label: '', href: '' }];
                                        next[columnIndex] = { ...column, links };
                                        set('columns', next);
                                    }}
                                >
                                    Add link
                                </Button>
                            </div>
                        </div>
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        leftIcon={<Plus size={14} />}
                        onClick={() => addItem('columns', { title: 'New column', links: [] })}
                    >
                        Add column
                    </Button>
                </div>
            </Panel>

            <Panel title="Social links" hint="Icon is chosen automatically from the name (LinkedIn, Facebook, YouTube, Instagram, Twitter/X).">
                <div className="space-y-2">
                    {socials.map((social, index) => (
                        <div key={index} className="flex items-end gap-2">
                            <div className="flex-1">
                                <TextField label="Name" value={social.name} onChange={(value) => updateItem('socials', index, 'name', value)} />
                            </div>
                            <div className="flex-1">
                                <TextField label="Link" value={social.href} onChange={(value) => updateItem('socials', index, 'href', value)} />
                            </div>
                            <button
                                type="button"
                                aria-label="Remove social"
                                onClick={() => removeItem('socials', index)}
                                className="mb-0.5 shrink-0 border border-slate-200 p-2 text-slate-400 transition-colors hover:border-rose-200 hover:text-rose-500 dark:border-slate-700 dark:hover:border-rose-900 dark:hover:text-rose-400"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        leftIcon={<Plus size={14} />}
                        onClick={() => addItem('socials', { name: '', href: '#' })}
                    >
                        Add social
                    </Button>
                </div>
            </Panel>

            <Panel title="Legal links">
                <div className="space-y-2">
                    {legal.map((item, index) => (
                        <div key={index} className="flex items-end gap-2">
                            <div className="flex-1">
                                <TextField label="Label" value={item.label} onChange={(value) => updateItem('legal', index, 'label', value)} />
                            </div>
                            <div className="flex-1">
                                <TextField label="Link" value={item.href} onChange={(value) => updateItem('legal', index, 'href', value)} />
                            </div>
                            <button
                                type="button"
                                aria-label="Remove legal link"
                                onClick={() => removeItem('legal', index)}
                                className="mb-0.5 shrink-0 border border-slate-200 p-2 text-slate-400 transition-colors hover:border-rose-200 hover:text-rose-500 dark:border-slate-700 dark:hover:border-rose-900 dark:hover:text-rose-400"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        leftIcon={<Plus size={14} />}
                        onClick={() => addItem('legal', { label: '', href: '' })}
                    >
                        Add legal link
                    </Button>
                </div>
            </Panel>
        </>
    );
}

LandingSettingsPage.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
