import { router } from '@inertiajs/react';
import { ImagePlus, Move, Palette, RotateCcw, Save, Trash2, Type } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import Button from '@/components/atoms/Button';
import { useBranding } from '@/hooks/useBranding';

type BgStyle = 'dark' | 'light' | 'gradient';
type Align = 'left' | 'center' | 'right';

export interface CertificateElementConfig {
    x: number;
    y: number;
    fontSize: number;
    color: string;
    align: Align;
    visible: boolean;
    text?: string;
    label?: string;
    prefix?: string;
}

export interface CertificateTemplate {
    mode?: 'default' | 'custom';
    background_path?: string | null;
    background_url?: string | null;
    primary_color: string;
    accent_color: string;
    bg_style: BgStyle;
    show_signature: boolean;
    signature_name: string;
    custom_title: string;
    footer_note: string;
    elements?: Record<string, Partial<CertificateElementConfig>>;
}

type CertificateTemplateInput = CertificateTemplate | Record<string, unknown>;
type CertificateElementMap = Record<string, Partial<CertificateElementConfig>>;

interface Props {
    courseSlug: string;
    rolePrefix: 'admin' | 'instructor';
    initialTemplate: CertificateTemplateInput;
    studentName?: string;
    courseTitle?: string;
    instructorName?: string;
    issuedAt?: string;
    certificateNumber?: string;
}

const DEFAULT_STYLE = {
    primary_color: '#7c3aed',
    accent_color: '#a78bfa',
    bg_style: 'dark' as BgStyle,
    show_signature: false,
    signature_name: '',
    custom_title: '',
    footer_note: '',
};

const ELEMENT_DEFAULTS: Record<string, CertificateElementConfig> = {
    title: { x: 50, y: 18, fontSize: 14, color: '#6b7280', align: 'center', visible: true, text: 'Certificate of Completion', label: 'Title' },
    subtitle: { x: 50, y: 28, fontSize: 10, color: '#6b7280', align: 'center', visible: true, text: 'This certifies that', label: 'Subtitle' },
    student_name: { x: 50, y: 38, fontSize: 38, color: '#111827', align: 'center', visible: true, label: 'Student Name' },
    completion_text: {
        x: 50,
        y: 48,
        fontSize: 10,
        color: '#6b7280',
        align: 'center',
        visible: true,
        text: 'has successfully completed',
        label: 'Completion Text',
    },
    course_title: { x: 50, y: 56, fontSize: 22, color: '#7c3aed', align: 'center', visible: true, label: 'Course Title' },
    issued_at: { x: 25, y: 72, fontSize: 11, color: '#374151', align: 'center', visible: true, label: 'Issued Date', prefix: 'Issued On' },
    certificate_number: {
        x: 50,
        y: 72,
        fontSize: 10,
        color: '#7c3aed',
        align: 'center',
        visible: true,
        label: 'Certificate Number',
        prefix: 'Certificate No.',
    },
    instructor_name: { x: 75, y: 72, fontSize: 11, color: '#374151', align: 'center', visible: true, label: 'Instructor', prefix: 'Instructor' },
    signature_name: { x: 50, y: 80, fontSize: 11, color: '#374151', align: 'center', visible: false, label: 'Signature Name', prefix: 'Instructor' },
    footer_note: { x: 50, y: 86, fontSize: 9, color: '#6b7280', align: 'center', visible: true, label: 'Footer Note', text: '' },
};

const ELEMENT_ORDER = [
    'title',
    'subtitle',
    'student_name',
    'completion_text',
    'course_title',
    'issued_at',
    'certificate_number',
    'instructor_name',
    'signature_name',
    'footer_note',
] as const;

const BG_OPTIONS: { value: BgStyle; label: string; desc: string }[] = [
    { value: 'dark', label: 'Dark', desc: 'Navy background (default style)' },
    { value: 'light', label: 'Light', desc: 'Clean white background' },
    { value: 'gradient', label: 'Gradient', desc: 'Dark gradient accent' },
];

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function normalizeTemplate(initial: CertificateTemplateInput) {
    const src = (initial || {}) as CertificateTemplate & { elements?: CertificateElementMap };
    const elements: Record<string, CertificateElementConfig> = {};

    for (const key of ELEMENT_ORDER) {
        const def = ELEMENT_DEFAULTS[key];
        const raw = src.elements?.[key] ?? {};
        elements[key] = {
            ...def,
            x: clamp(Number(raw.x ?? def.x), 0, 100),
            y: clamp(Number(raw.y ?? def.y), 0, 100),
            fontSize: clamp(Number(raw.fontSize ?? def.fontSize), 6, 120),
            color: typeof raw.color === 'string' ? raw.color : def.color,
            align: (raw.align && ['left', 'center', 'right'].includes(raw.align) ? raw.align : def.align) as Align,
            visible: typeof raw.visible === 'boolean' ? raw.visible : Boolean(def.visible),
            text: typeof raw.text === 'string' ? raw.text : def.text,
            label: def.label,
            prefix: def.prefix,
        };
    }

    if (typeof src.custom_title === 'string' && src.custom_title) elements.title.text = src.custom_title;
    if (typeof src.footer_note === 'string') elements.footer_note.text = src.footer_note;
    if (typeof src.show_signature === 'boolean') elements.signature_name.visible = src.show_signature;

    return {
        mode: (src.background_path ? 'custom' : src.mode || 'default') as 'default' | 'custom',
        background_path: src.background_path ?? null,
        background_url: src.background_url ?? null,
        primary_color: src.primary_color || DEFAULT_STYLE.primary_color,
        accent_color: src.accent_color || DEFAULT_STYLE.accent_color,
        bg_style: (src.bg_style || DEFAULT_STYLE.bg_style) as BgStyle,
        show_signature: Boolean(src.show_signature),
        signature_name: src.signature_name || '',
        custom_title: src.custom_title || (elements.title.text ?? ''),
        footer_note: src.footer_note || (elements.footer_note.text ?? ''),
        elements,
    };
}

export default function CertificateTemplateEditor({
    courseSlug,
    rolePrefix,
    initialTemplate,
    studentName = 'Budi Santoso',
    courseTitle = 'Product Design Mastery',
    instructorName = 'Your Name',
    issuedAt = '01 Jan 2026',
    certificateNumber = 'KRSIO-XXXXXX',
}: Props) {
    const { name: brandName } = useBranding();
    const normalizedInitial = useMemo(() => normalizeTemplate(initialTemplate), [initialTemplate]);
    const [template, setTemplate] = useState(normalizedInitial);
    const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
    const [removeBackground, setRemoveBackground] = useState(false);
    const [selected, setSelected] = useState<(typeof ELEMENT_ORDER)[number]>('student_name');
    const [saving, setSaving] = useState(false);
    const previewUrl = useMemo(() => (backgroundFile ? URL.createObjectURL(backgroundFile) : null), [backgroundFile]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    useEffect(() => {
        setTemplate(normalizedInitial);
        setBackgroundFile(null);
        setRemoveBackground(false);
    }, [normalizedInitial]);

    const activeBackgroundUrl = !removeBackground ? previewUrl || template.background_url : null;
    const isCustom = Boolean(activeBackgroundUrl);

    const setElement = (key: string, patch: Partial<CertificateElementConfig>) => {
        setTemplate((prev) => ({
            ...prev,
            elements: {
                ...prev.elements,
                [key]: { ...(prev.elements?.[key] as CertificateElementConfig), ...patch },
            },
        }));
    };

    const setField = <K extends keyof typeof template>(key: K, value: (typeof template)[K]) => {
        setTemplate((prev) => ({ ...prev, [key]: value }));
    };

    const syncLegacyFromElements = (next: typeof template) => {
        const elements = next.elements || {};
        return {
            ...next,
            custom_title: elements.title?.text || '',
            footer_note: elements.footer_note?.text || '',
            signature_name: next.signature_name,
            show_signature: Boolean(elements.signature_name?.visible),
        };
    };

    const save = () => {
        const url = `/${rolePrefix}/courses/${courseSlug}/certificate-template`;
        const synced = syncLegacyFromElements(template);
        const data = new FormData();
        data.append('_method', 'PUT');
        data.append('mode', isCustom ? 'custom' : 'default');
        data.append('primary_color', synced.primary_color);
        data.append('accent_color', synced.accent_color);
        data.append('bg_style', synced.bg_style);
        data.append('show_signature', synced.show_signature ? '1' : '0');
        data.append('signature_name', synced.signature_name || '');
        data.append('custom_title', synced.custom_title || '');
        data.append('footer_note', synced.footer_note || '');
        data.append('elements', JSON.stringify(synced.elements || {}));
        if (removeBackground) data.append('remove_background', '1');
        if (backgroundFile) data.append('background_image', backgroundFile);

        router.post(url, data, {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => setSaving(true),
            onFinish: () => setSaving(false),
            onSuccess: () => {
                setBackgroundFile(null);
            },
        });
    };

    const reset = () => {
        setTemplate(normalizedInitial);
        setBackgroundFile(null);
        setRemoveBackground(false);
    };

    const selectedEl = (template.elements?.[selected] || ELEMENT_DEFAULTS[selected]) as CertificateElementConfig;

    return (
        <div className="space-y-6">
            <div className="rounded-none border border-blue-200 bg-blue-50 p-4 text-xs text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
                <p className="font-semibold">Rekomendasi profesional</p>
                <p className="mt-1">
                    Upload desain sertifikat (A4 landscape, PNG/JPG) sebagai background, lalu atur posisi setiap teks (nama, kursus, nomor, tanggal,
                    dsb.) dengan drag pada preview. Ini cara paling umum agar hasil PDF konsisten dengan desain.
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                <div className="space-y-5 lg:col-span-5">
                    <div className="space-y-3 border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-700 dark:bg-[#1e1f24]">
                        <SectionTitle icon={<ImagePlus size={15} />} title="Template Background" />
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                if (file) {
                                    setBackgroundFile(file);
                                    setRemoveBackground(false);
                                    setField('mode', 'custom');
                                }
                            }}
                            className="block w-full text-xs text-slate-600 file:mr-3 file:border-0 file:bg-purple-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-purple-700 hover:file:bg-purple-100 dark:text-slate-300"
                        />
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Disarankan ukuran A4 landscape (mis. 3508×2480 px atau rasio 842×595). Upload gambar desain, lalu posisikan teks di
                            atasnya.
                        </p>
                        {activeBackgroundUrl && (
                            <div className="flex items-center gap-2">
                                <span className="inline-flex rounded-none border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                                    Custom template aktif
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    leftIcon={<Trash2 size={13} />}
                                    className="!rounded-none"
                                    onClick={() => {
                                        setBackgroundFile(null);
                                        setRemoveBackground(true);
                                        setField('mode', 'default');
                                    }}
                                >
                                    Hapus background
                                </Button>
                            </div>
                        )}
                        {!activeBackgroundUrl && (
                            <span className="inline-flex rounded-none border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                Mode default (tanpa upload)
                            </span>
                        )}
                    </div>

                    <div className="space-y-4 border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-700 dark:bg-[#1e1f24]">
                        <SectionTitle icon={<Type size={15} />} title="Elemen Teks & Posisi" />
                        <div className="flex flex-wrap gap-1.5">
                            {ELEMENT_ORDER.map((key) => {
                                const el = template.elements?.[key];
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setSelected(key)}
                                        className={`rounded-none border px-2 py-1 text-[11px] font-semibold ${selected === key ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300'} ${el?.visible ? '' : 'opacity-50'}`}
                                    >
                                        {el?.label || key}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="space-y-3 border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{selectedEl.label || selected}</p>
                                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(selectedEl.visible)}
                                        onChange={(e) => {
                                            const visible = e.target.checked;
                                            setElement(selected, { visible });
                                            if (selected === 'signature_name') setField('show_signature', visible);
                                            if (selected === 'footer_note')
                                                setField('footer_note', visible ? selectedEl.text || '' : template.footer_note);
                                        }}
                                    />
                                    Tampilkan
                                </label>
                            </div>

                            {['title', 'subtitle', 'completion_text', 'footer_note'].includes(selected) && (
                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">Teks</label>
                                    <input
                                        type="text"
                                        value={selectedEl.text || ''}
                                        onChange={(e) => {
                                            const text = e.target.value;
                                            setElement(selected, { text });
                                            if (selected === 'title') setField('custom_title', text);
                                            if (selected === 'footer_note') setField('footer_note', text);
                                        }}
                                        className="w-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-100"
                                    />
                                </div>
                            )}

                            {selected === 'signature_name' && (
                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">Nama tanda tangan</label>
                                    <input
                                        type="text"
                                        value={template.signature_name}
                                        onChange={(e) => setField('signature_name', e.target.value)}
                                        placeholder={instructorName}
                                        className="w-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-100"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <NumberInput
                                    label="Posisi X (%)"
                                    value={selectedEl.x}
                                    min={0}
                                    max={100}
                                    step={0.5}
                                    onChange={(v) => setElement(selected, { x: v })}
                                />
                                <NumberInput
                                    label="Posisi Y (%)"
                                    value={selectedEl.y}
                                    min={0}
                                    max={100}
                                    step={0.5}
                                    onChange={(v) => setElement(selected, { y: v })}
                                />
                                <NumberInput
                                    label="Ukuran font"
                                    value={selectedEl.fontSize}
                                    min={6}
                                    max={120}
                                    step={1}
                                    onChange={(v) => setElement(selected, { fontSize: v })}
                                />
                                <div>
                                    <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">Warna</label>
                                    <div className="flex items-center gap-2 border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-[#1e1f24]">
                                        <input
                                            type="color"
                                            value={selectedEl.color}
                                            onChange={(e) => setElement(selected, { color: e.target.value })}
                                            className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
                                        />
                                        <span className="font-mono text-[10px] text-slate-500 uppercase">{selectedEl.color}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">Perataan</label>
                                <div className="flex gap-1">
                                    {(['left', 'center', 'right'] as Align[]).map((a) => (
                                        <button
                                            key={a}
                                            type="button"
                                            onClick={() => setElement(selected, { align: a })}
                                            className={`flex-1 border px-2 py-1 text-[11px] font-semibold capitalize ${selectedEl.align === a ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}
                                        >
                                            {a}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <p className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <Move size={12} /> Tip: drag elemen langsung di preview untuk mengatur posisi.
                            </p>
                        </div>
                    </div>

                    {!isCustom && (
                        <div className="space-y-4 border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-700 dark:bg-[#1e1f24]">
                            <SectionTitle icon={<Palette size={15} />} title="Gaya Default (tanpa background upload)" />
                            <div className="grid grid-cols-2 gap-3">
                                <ColorInput label="Primary" value={template.primary_color} onChange={(v) => setField('primary_color', v)} />
                                <ColorInput label="Accent" value={template.accent_color} onChange={(v) => setField('accent_color', v)} />
                            </div>
                            <div className="space-y-2">
                                {BG_OPTIONS.map((opt) => (
                                    <label
                                        key={opt.value}
                                        className={`flex cursor-pointer items-start gap-3 border p-3 ${template.bg_style === opt.value ? 'border-purple-300 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30' : 'border-slate-200 dark:border-slate-700'}`}
                                    >
                                        <input
                                            type="radio"
                                            name="bg_style"
                                            checked={template.bg_style === opt.value}
                                            onChange={() => setField('bg_style', opt.value)}
                                            className="mt-0.5 accent-purple-600"
                                        />
                                        <div>
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{opt.label}</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500">{opt.desc}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button onClick={save} isLoading={saving} leftIcon={<Save size={15} />} className="flex-1 !rounded-none">
                            {saving ? 'Menyimpan…' : 'Simpan Template'}
                        </Button>
                        <Button variant="outline" onClick={reset} leftIcon={<RotateCcw size={14} />} className="!rounded-none">
                            Reset
                        </Button>
                    </div>
                </div>

                <div className="lg:col-span-7">
                    <div className="sticky top-20 space-y-3">
                        <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Live Preview</p>
                            <span className="text-[10px] text-slate-400">
                                {isCustom ? 'Drag elemen untuk mengatur posisi' : 'Preview gaya default'}
                            </span>
                        </div>
                        <CertificatePreview
                            template={template}
                            backgroundUrl={activeBackgroundUrl}
                            isCustom={isCustom}
                            selected={selected}
                            onSelect={setSelected}
                            onMove={(key, x, y) => setElement(key, { x, y })}
                            values={{
                                student_name: studentName,
                                course_title: courseTitle,
                                certificate_number: certificateNumber,
                                issued_at: issuedAt,
                                instructor_name: instructorName,
                                brand_name: brandName,
                                signature_name: template.signature_name || instructorName,
                            }}
                        />
                        <p className="text-center text-[10px] text-slate-400">
                            Preview mendekati hasil PDF (posisi menggunakan persentase agar responsif terhadap ukuran template).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CertificatePreview({
    template,
    backgroundUrl,
    isCustom,
    selected,
    onSelect,
    onMove,
    values,
}: {
    template: ReturnType<typeof normalizeTemplate>;
    backgroundUrl: string | null;
    isCustom: boolean;
    selected: string;
    onSelect: (k: (typeof ELEMENT_ORDER)[number]) => void;
    onMove: (k: string, x: number, y: number) => void;
    values: Record<string, string>;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{ key: string } | null>(null);

    useEffect(() => {
        const onMovePointer = (e: PointerEvent) => {
            if (!dragRef.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
            const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100);
            onMove(dragRef.current.key, Math.round(x * 10) / 10, Math.round(y * 10) / 10);
        };
        const onUp = () => {
            dragRef.current = null;
        };
        window.addEventListener('pointermove', onMovePointer);
        window.addEventListener('pointerup', onUp);
        return () => {
            window.removeEventListener('pointermove', onMovePointer);
            window.removeEventListener('pointerup', onUp);
        };
    }, [onMove]);

    const startDrag = (key: string, e: React.PointerEvent) => {
        if (!isCustom) return;
        e.preventDefault();
        e.stopPropagation();
        onSelect(key as (typeof ELEMENT_ORDER)[number]);
        dragRef.current = { key };
    };

    if (isCustom && backgroundUrl) {
        return (
            <div
                ref={containerRef}
                className="relative w-full overflow-hidden border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-700"
                style={{ aspectRatio: '842/595' }}
            >
                <img src={backgroundUrl} alt="Certificate background" className="absolute inset-0 h-full w-full object-cover" />
                {ELEMENT_ORDER.map((key) => {
                    const el = template.elements[key];
                    if (!el?.visible) return null;
                    const text = resolveElementText(key, el, template, values);
                    if (!text) return null;
                    const tx = el.align === 'left' ? '0' : el.align === 'right' ? '-100%' : '-50%';
                    return (
                        <div
                            key={key}
                            onPointerDown={(e) => startDrag(key, e)}
                            onClick={() => onSelect(key)}
                            className={`absolute cursor-move select-none ${selected === key ? 'ring-2 ring-purple-500 ring-offset-1' : ''}`}
                            style={{
                                left: `${el.x}%`,
                                top: `${el.y}%`,
                                transform: `translate(${tx}, -50%)`,
                                color: el.color,
                                fontSize: `${el.fontSize}px`,
                                textAlign: el.align,
                                width: '70%',
                                lineHeight: 1.2,
                            }}
                            title="Drag untuk pindah posisi"
                        >
                            {['issued_at', 'certificate_number', 'instructor_name', 'signature_name'].includes(key) && el.prefix && (
                                <div
                                    style={{
                                        fontSize: `${Math.max(7, el.fontSize * 0.45)}px`,
                                        letterSpacing: '0.12em',
                                        textTransform: 'uppercase',
                                        opacity: 0.7,
                                    }}
                                >
                                    {el.prefix}
                                </div>
                            )}
                            <div style={{ fontWeight: ['student_name', 'course_title', 'title'].includes(key) ? 700 : 400 }}>{text}</div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Default/built-in style preview (simplified)
    const isDark = template.bg_style !== 'light';
    const bgStyle =
        template.bg_style === 'dark'
            ? { background: 'linear-gradient(135deg, #0f0f18 0%, #1a0a2e 50%, #0f0f18 100%)' }
            : template.bg_style === 'gradient'
              ? { background: `linear-gradient(135deg, #0f0f18 0%, ${template.primary_color}55 50%, #0f0f18 100%)` }
              : { background: '#f8f7ff' };
    const textPrimary = isDark ? '#f1f5f9' : '#1e1b4b';
    const textSecondary = isDark ? '#94a3b8' : '#64748b';

    return (
        <div
            className="relative w-full overflow-hidden border shadow-sm"
            style={{ ...bgStyle, aspectRatio: '842/595', borderColor: `${template.primary_color}33` }}
        >
            <div className="absolute inset-3 border opacity-40" style={{ borderColor: template.accent_color }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
                <p className="mb-2 text-[8px] font-bold tracking-[4px] uppercase" style={{ color: template.accent_color }}>
                    {values.brand_name}
                </p>
                <p className="mb-3 text-[7px] tracking-[3px] uppercase" style={{ color: textSecondary }}>
                    {template.custom_title || 'Certificate of Completion'}
                </p>
                <p className="mb-1 text-[6px] tracking-[2px] uppercase" style={{ color: textSecondary }}>
                    This certifies that
                </p>
                <p className="text-xl font-bold" style={{ color: textPrimary }}>
                    {values.student_name}
                </p>
                <div className="my-2 h-px w-28" style={{ background: `${template.accent_color}80` }} />
                <p className="mb-1 text-[6px] uppercase" style={{ color: textSecondary }}>
                    has successfully completed
                </p>
                <p className="text-[11px] font-bold" style={{ color: template.accent_color }}>
                    {values.course_title}
                </p>
                <div className="mt-4 flex w-full max-w-xs justify-center gap-4 text-center">
                    {[
                        ['Issued On', values.issued_at],
                        ['Certificate No.', values.certificate_number],
                        ['Instructor', values.instructor_name],
                    ].map(([l, v], i) => (
                        <div key={i} className="flex-1">
                            <p className="text-[5px] uppercase" style={{ color: textSecondary }}>
                                {l}
                            </p>
                            <p className="text-[6px] font-bold" style={{ color: i === 1 ? template.primary_color : textSecondary }}>
                                {v}
                            </p>
                        </div>
                    ))}
                </div>
                {template.show_signature && (
                    <div className="mt-3 flex justify-center gap-10">
                        <div className="text-center">
                            <div className="mb-1 h-px w-20" style={{ borderTop: `1px solid ${template.accent_color}40` }} />
                            <p className="text-[6px]" style={{ color: textSecondary }}>
                                {template.signature_name || values.instructor_name}
                            </p>
                        </div>
                    </div>
                )}
                {template.footer_note && (
                    <p className="mt-2 text-[6px] italic" style={{ color: textSecondary }}>
                        "{template.footer_note}"
                    </p>
                )}
            </div>
        </div>
    );
}

function resolveElementText(
    key: string,
    el: CertificateElementConfig,
    template: ReturnType<typeof normalizeTemplate>,
    values: Record<string, string>,
) {
    switch (key) {
        case 'title':
            return el.text || template.custom_title || 'Certificate of Completion';
        case 'subtitle':
            return el.text || 'This certifies that';
        case 'completion_text':
            return el.text || 'has successfully completed';
        case 'student_name':
            return values.student_name;
        case 'course_title':
            return values.course_title;
        case 'issued_at':
            return values.issued_at;
        case 'certificate_number':
            return values.certificate_number;
        case 'instructor_name':
            return values.instructor_name;
        case 'signature_name':
            return values.signature_name || values.instructor_name;
        case 'footer_note':
            return el.text || template.footer_note || '';
        default:
            return el.text || '';
    }
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-slate-700">
            <span className="text-purple-500">{icon}</span>
            <h4 className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-200">{title}</h4>
        </div>
    );
}

function NumberInput({
    label,
    value,
    min,
    max,
    step,
    onChange,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (v: number) => void;
}) {
    return (
        <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">{label}</label>
            <input
                type="number"
                value={value}
                min={min}
                max={max}
                step={step}
                onChange={(e) => onChange(clamp(Number(e.target.value || 0), min, max))}
                className="w-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-100"
            />
        </div>
    );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">{label}</label>
            <div className="flex items-center gap-2 border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-[#1e1f24]">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="font-mono text-[10px] text-slate-500 uppercase">{value}</span>
            </div>
        </div>
    );
}
