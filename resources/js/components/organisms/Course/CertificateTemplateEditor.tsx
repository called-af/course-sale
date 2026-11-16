import { router } from '@inertiajs/react';
import { Award, Info, Palette, RotateCcw, Save, Shield } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/atoms/Button';
import { useBranding } from '@/hooks/useBranding';

export interface CertificateTemplate {
    primary_color: string;
    accent_color: string;
    bg_style: 'dark' | 'light' | 'gradient';
    show_signature: boolean;
    signature_name: string;
    custom_title: string;
    footer_note: string;
}

interface Props {
    courseSlug: string;
    rolePrefix: 'admin' | 'instructor';
    initialTemplate: CertificateTemplate;
    studentName?: string;
    courseTitle?: string;
    instructorName?: string;
    issuedAt?: string;
    certificateNumber?: string;
}

const DEFAULTS: CertificateTemplate = {
    primary_color: '#7c3aed',
    accent_color: '#a78bfa',
    bg_style: 'dark',
    show_signature: false,
    signature_name: '',
    custom_title: '',
    footer_note: '',
};

const BG_OPTIONS: { value: CertificateTemplate['bg_style']; label: string; desc: string }[] = [
    { value: 'dark', label: 'Dark', desc: 'Dark navy background — premium look' },
    { value: 'light', label: 'Light', desc: 'Clean white background — minimal & professional' },
    { value: 'gradient', label: 'Gradient', desc: 'Gradient with primary color accent' },
];

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
    const [template, setTemplate] = useState<CertificateTemplate>({ ...DEFAULTS, ...initialTemplate });
    const [saving, setSaving] = useState(false);

    const set = <K extends keyof CertificateTemplate>(key: K, value: CertificateTemplate[K]) => setTemplate((prev) => ({ ...prev, [key]: value }));

    const reset = () => setTemplate({ ...initialTemplate });

    const save = () => {
        const url = `/${rolePrefix}/courses/${courseSlug}/certificate-template`;
        router.put(url, template as unknown as Record<string, string | boolean>, {
            onStart: () => setSaving(true),
            onFinish: () => setSaving(false),
            preserveScroll: true,
        });
    };

    return (
        <div className="grid gap-8 lg:grid-cols-12">
            {/* ── FORM COLUMN ─────────────────────────────────── */}
            <div className="space-y-5 lg:col-span-5">
                {/* Colors */}
                <div className="space-y-4 border border-slate-200 bg-white p-5 shadow-xs">
                    <SectionTitle icon={<Palette size={15} />} title="Colors" />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">Primary Color</label>
                            <div className="flex items-center gap-2 border border-slate-200 p-1.5">
                                <input
                                    type="color"
                                    value={template.primary_color}
                                    onChange={(e) => set('primary_color', e.target.value)}
                                    className="h-7 w-10 cursor-pointer border-0 bg-transparent p-0"
                                />
                                <span className="font-mono text-xs text-slate-500 uppercase">{template.primary_color}</span>
                            </div>
                            <p className="mt-1 text-[10px] text-slate-400">Border, seal, cert number</p>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">Accent Color</label>
                            <div className="flex items-center gap-2 border border-slate-200 p-1.5">
                                <input
                                    type="color"
                                    value={template.accent_color}
                                    onChange={(e) => set('accent_color', e.target.value)}
                                    className="h-7 w-10 cursor-pointer border-0 bg-transparent p-0"
                                />
                                <span className="font-mono text-xs text-slate-500 uppercase">{template.accent_color}</span>
                            </div>
                            <p className="mt-1 text-[10px] text-slate-400">Brand name, course title</p>
                        </div>
                    </div>
                </div>

                {/* Background Style */}
                <div className="space-y-3 border border-slate-200 bg-white p-5 shadow-xs">
                    <SectionTitle icon={<Info size={15} />} title="Background Style" />
                    <div className="space-y-2">
                        {BG_OPTIONS.map((opt) => (
                            <label
                                key={opt.value}
                                className={`flex cursor-pointer items-start gap-3 border p-3 transition-colors ${
                                    template.bg_style === opt.value ? 'border-purple-300 bg-purple-50' : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="bg_style"
                                    value={opt.value}
                                    checked={template.bg_style === opt.value}
                                    onChange={() => set('bg_style', opt.value)}
                                    className="mt-0.5 accent-purple-600"
                                />
                                <div>
                                    <p className="text-xs font-semibold text-slate-700">{opt.label}</p>
                                    <p className="text-[10px] text-slate-400">{opt.desc}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Text */}
                <div className="space-y-4 border border-slate-200 bg-white p-5 shadow-xs">
                    <SectionTitle icon={<Award size={15} />} title="Certificate Text" />

                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-600">
                            Certificate Title
                            <span className="ml-1 font-normal text-slate-400">(leave blank for default)</span>
                        </label>
                        <input
                            type="text"
                            value={template.custom_title}
                            onChange={(e) => set('custom_title', e.target.value)}
                            placeholder="Certificate of Completion"
                            maxLength={100}
                            className="w-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-300 focus:border-purple-400 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-slate-600">
                            Footer Note
                            <span className="ml-1 font-normal text-slate-400">(optional quote or message)</span>
                        </label>
                        <textarea
                            value={template.footer_note}
                            onChange={(e) => set('footer_note', e.target.value)}
                            placeholder="e.g. This certificate validates continuous learning and professional growth."
                            maxLength={200}
                            rows={2}
                            className="w-full resize-none border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-300 focus:border-purple-400 focus:outline-none"
                        />
                        <p className="mt-0.5 text-right text-[10px] text-slate-400">{template.footer_note.length}/200</p>
                    </div>
                </div>

                {/* Signature */}
                <div className="space-y-3 border border-slate-200 bg-white p-5 shadow-xs">
                    <SectionTitle icon={<Shield size={15} />} title="Signature" />

                    <label className="flex cursor-pointer items-center gap-3">
                        <div
                            onClick={() => set('show_signature', !template.show_signature)}
                            className={`relative h-5 w-9 flex-none cursor-pointer transition-colors ${
                                template.show_signature ? 'bg-purple-600' : 'bg-slate-200'
                            }`}
                        >
                            <span
                                className={`absolute top-0.5 h-4 w-4 bg-white shadow-xs transition-transform ${
                                    template.show_signature ? 'translate-x-4' : 'translate-x-0.5'
                                }`}
                            />
                        </div>
                        <span className="text-xs font-medium text-slate-700">Show signature lines on certificate</span>
                    </label>

                    {template.show_signature && (
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">Instructor Signature Name</label>
                            <input
                                type="text"
                                value={template.signature_name}
                                onChange={(e) => set('signature_name', e.target.value)}
                                placeholder="Instructor name for signature"
                                maxLength={100}
                                className="w-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-300 focus:border-purple-400 focus:outline-none"
                            />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button onClick={save} isLoading={saving} leftIcon={<Save size={15} />} className="flex-1 !rounded-none">
                        {saving ? 'Saving…' : 'Save Template'}
                    </Button>
                    <Button variant="outline" onClick={reset} title="Reset to defaults" leftIcon={<RotateCcw size={14} />} className="!rounded-none">
                        Reset
                    </Button>
                </div>
            </div>

            {/* ── LIVE PREVIEW COLUMN ─────────────────────────── */}
            <div className="lg:col-span-7">
                <div className="sticky top-20 space-y-3">
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Live Preview</p>
                        <span className="text-[10px] text-slate-400">— how the certificate will look</span>
                    </div>
                    <CertificatePreviewCard
                        template={template}
                        studentName={studentName}
                        courseTitle={courseTitle}
                        instructorName={instructorName}
                        issuedAt={issuedAt}
                        certificateNumber={certificateNumber}
                    />
                    <p className="text-center text-[10px] text-slate-400">
                        This is an approximate preview. The actual PDF may differ slightly in font rendering.
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ── LIVE PREVIEW CARD ──────────────────────────────────────────────────── */
function CertificatePreviewCard({
    template,
    studentName = 'Budi Santoso',
    courseTitle = 'Product Design Mastery',
    instructorName = 'Your Name',
    issuedAt = '01 Jan 2026',
    certificateNumber = 'KRSIO-XXXXXX',
}: {
    template: CertificateTemplate;
    studentName?: string;
    courseTitle?: string;
    instructorName?: string;
    issuedAt?: string;
    certificateNumber?: string;
}) {
    const { name: brandName, domain } = useBranding();
    const sealName = brandName.toUpperCase();
    const sealHalf = Math.ceil(sealName.length / 2);
    const sealTop = sealName.slice(0, sealHalf);
    const sealBottom = sealName.slice(sealHalf);
    const { primary_color, accent_color, bg_style, show_signature, signature_name, custom_title, footer_note } = template;

    const title = custom_title || 'Certificate of Completion';
    const sigName = signature_name || 'Instructor';

    const bgClass = bg_style === 'light' ? 'bg-[#f8f7ff]' : bg_style === 'gradient' ? '' : '';

    const bgInlineStyle =
        bg_style === 'dark'
            ? { background: 'linear-gradient(135deg, #0f0f18 0%, #1a0a2e 50%, #0f0f18 100%)' }
            : bg_style === 'gradient'
              ? { background: `linear-gradient(135deg, #0f0f18 0%, ${primary_color}55 50%, #0f0f18 100%)` }
              : {};

    const isDark = bg_style !== 'light';
    const textPrimary = isDark ? '#f1f5f9' : '#1e1b4b';
    const textSecondary = isDark ? '#94a3b8' : '#64748b';
    const textMuted = isDark ? '#475569' : '#94a3b8';

    return (
        <div
            className={`relative w-full overflow-hidden border shadow-sm ${bgClass}`}
            style={{ ...bgInlineStyle, aspectRatio: '842/595', borderColor: `${primary_color}33` }}
        >
            {/* Blobs */}
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-20" style={{ background: primary_color }} />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full opacity-10" style={{ background: primary_color }} />

            {/* Outer border */}
            <div className="absolute inset-3 border opacity-40" style={{ borderColor: accent_color }} />
            {/* Inner border */}
            <div className="absolute inset-5 border opacity-20" style={{ borderColor: accent_color }} />

            {/* Corner ornaments */}
            {[
                'top-1.5 left-1.5 border-t-2 border-l-2',
                'top-1.5 right-1.5 border-t-2 border-r-2',
                'bottom-1.5 left-1.5 border-b-2 border-l-2',
                'bottom-1.5 right-1.5 border-b-2 border-r-2',
            ].map((cls, i) => (
                <div key={i} className={`absolute h-6 w-6 ${cls}`} style={{ borderColor: primary_color }} />
            ))}

            {/* Content */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center px-12 text-center ${show_signature ? 'pb-8' : ''}`}>
                {/* Brand */}
                <p className="mb-1.5 text-[8px] font-bold tracking-[4px] uppercase" style={{ color: accent_color }}>
                    {brandName}
                </p>
                <div className="mb-2 h-px w-8" style={{ background: `${accent_color}80` }} />
                {/* Title */}
                <p className="mb-3 text-[7px] font-normal tracking-[3px] uppercase" style={{ color: textSecondary }}>
                    {title}
                </p>

                {/* Recipient */}
                <p className="mb-1 text-[6px] tracking-[2px] uppercase" style={{ color: textMuted }}>
                    This certifies that
                </p>
                <p className="text-xl leading-tight font-bold" style={{ color: textPrimary }}>
                    {studentName}
                </p>
                <div className="my-2 h-px w-28" style={{ background: `linear-gradient(90deg, transparent, ${accent_color}80, transparent)` }} />
                <p className="mb-1.5 text-[6px] tracking-[1.5px] uppercase" style={{ color: textMuted }}>
                    has successfully completed
                </p>
                <p className="max-w-[55%] text-[11px] leading-snug font-bold" style={{ color: accent_color }}>
                    {courseTitle}
                </p>

                {/* Footer row */}
                <div className="mt-3 flex w-full max-w-xs justify-center divide-x text-center">
                    {[
                        ['Issued On', issuedAt],
                        ['Certificate No.', certificateNumber],
                        ['Instructor', instructorName],
                    ].map(([label, value], i) => (
                        <div key={i} className="flex-1 px-3">
                            <p className="mb-0.5 text-[5px] tracking-widest uppercase" style={{ color: textMuted }}>
                                {label}
                            </p>
                            <p
                                className={`text-[6px] font-bold ${i === 1 ? 'font-mono' : ''}`}
                                style={{ color: i === 1 ? primary_color : textSecondary }}
                            >
                                {value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Signature */}
                {show_signature && (
                    <div className="mt-3 flex justify-center gap-10">
                        {[sigName, brandName].map((name, i) => (
                            <div key={i} className="text-center">
                                <div className="mb-1 h-px w-20" style={{ borderTop: `1px solid ${accent_color}40` }} />
                                <p className="text-[6px]" style={{ color: textSecondary }}>
                                    {name}
                                </p>
                                <p className="text-[5px] tracking-widest uppercase opacity-50" style={{ color: textMuted }}>
                                    {i === 0 ? 'Instructor' : 'Platform'}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer note */}
                {footer_note && (
                    <p className="mt-2 max-w-xs text-[6px] italic" style={{ color: textMuted }}>
                        "{footer_note}"
                    </p>
                )}
            </div>

            {/* Seal */}
            <div
                className="absolute right-4 bottom-4 flex h-12 w-12 items-center justify-center rounded-full border-2"
                style={{ borderColor: `${primary_color}80` }}
            >
                <div className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: `${primary_color}40` }}>
                    <p className="text-center text-[4.5px] leading-tight font-bold tracking-wide uppercase" style={{ color: primary_color }}>
                        {sealTop}
                        <br />
                        {sealBottom}
                        <br />
                        VERIFIED
                    </p>
                </div>
            </div>

            {/* Verify URL */}
            <p className="absolute bottom-[18px] left-4 text-[5px]" style={{ color: textMuted }}>
                Verify at: {domain}/certificate/KRSIO-XXXXXX
            </p>
        </div>
    );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="text-purple-500">{icon}</span>
            <h4 className="text-xs font-bold tracking-wider text-slate-700 uppercase">{title}</h4>
        </div>
    );
}
