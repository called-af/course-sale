import type { FormDataConvertible } from '@inertiajs/core';
import { Head, Link, router } from '@inertiajs/react';
import { ExternalLink, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import Button from '@/components/atoms/Button';
import PageHeader from '@/components/molecules/PageHeader';
import AdminLayout from '@/components/templates/AdminLayout';
import type { TestimonialItem } from '@/types';

interface LandingSettingsPageProps {
    section: string;
    label: string;
    content: Record<string, unknown>;
    testimonials: TestimonialItem[];
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
    { key: 'testimonial', label: 'Testimonial' },
    { key: 'cta', label: 'CTA' },
    { key: 'footer', label: 'Footer' },
];

interface PendingUpload {
    file: File;
    preview: string;
    kind?: 'photo' | 'avatar';
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
}: {
    label: string;
    value: unknown;
    onChange: (value: string) => void;
    rows?: number;
    hint?: string;
}) {
    return (
        <Field label={label} hint={hint}>
            <textarea
                className={inputClass}
                rows={rows}
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

export default function LandingSettingsPage({ section, label, content, testimonials = [] }: LandingSettingsPageProps) {
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

        if (section === 'hero' && (photoUploads.length > 0 || avatarUploads.length > 0)) {
            // Inertia only supports file uploads on POST, so spoof PUT.
            router.post(
                url,
                {
                    _method: 'put',
                    content: data as FormDataConvertible,
                    photos: photoUploads.map((upload) => upload.file),
                    avatars: avatarUploads.map((upload) => upload.file),
                },
                { ...options, forceFormData: true },
            );

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
                    description="Ubah konten section ini. Perubahan langsung tampil di halaman landing."
                    actions={
                        <Link href="/" target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" rightIcon={<ExternalLink size={14} />}>
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
                    {section === 'hero' && (
                        <HeroForm data={data} set={set} list={list} uploads={uploads} onAddUploads={addUploads} onRemoveUpload={removeUpload} />
                    )}

                    {section === 'about' && (
                        <AboutForm data={data} set={set} list={list} updateItem={updateItem} removeItem={removeItem} addItem={addItem} />
                    )}

                    {section === 'courses' && <CoursesForm data={data} set={set} />}

                    {section === 'career' && <CareerForm data={data} set={set} />}

                    {section === 'testimonial' && <TestimonialForm data={data} set={set} testimonials={testimonials} />}

                    {section === 'cta' && <CtaForm data={data} set={set} />}

                    {section === 'footer' && (
                        <FooterForm data={data} set={set} list={list} updateItem={updateItem} removeItem={removeItem} addItem={addItem} />
                    )}

                    <div className="sticky bottom-4 flex items-center justify-between gap-4 border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-[#1e1f24]/95">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Perubahan disimpan untuk section <strong>{label}</strong>.
                        </p>
                        <Button type="submit" isLoading={saving} leftIcon={<Save size={16} />}>
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
