export type BgStyle = 'dark' | 'light' | 'gradient';
export type Align = 'left' | 'center' | 'right';
export type DesignerTab = 'layouts' | 'elements' | 'style' | 'uploads';

export interface ElementConfig {
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
    mode: 'default' | 'custom';
    background_path: string | null;
    background_url: string | null;
    primary_color: string;
    accent_color: string;
    bg_style: BgStyle;
    show_signature: boolean;
    signature_name: string;
    signature_image: string | null;
    signature_image_url: string | null;
    custom_title: string;
    footer_note: string;
    elements: Record<ElementKey, ElementConfig>;
}

export interface RawTemplate {
    mode?: 'default' | 'custom';
    background_path?: string | null;
    background_url?: string | null;
    primary_color?: string;
    accent_color?: string;
    bg_style?: BgStyle;
    show_signature?: boolean;
    signature_name?: string;
    signature_image?: string | null;
    signature_image_url?: string | null;
    custom_title?: string;
    footer_note?: string;
    elements?: Record<string, Partial<ElementConfig>>;
}

export const CANVAS_W = 842;
export const CANVAS_H = 595;
export const CANVAS_RATIO = `${CANVAS_W} / ${CANVAS_H}`;

export const ELEMENT_ORDER = [
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

export type FixedElementKey = (typeof ELEMENT_ORDER)[number];
export type CustomElementKey = `custom_${string}`;
export type ElementKey = FixedElementKey | CustomElementKey;

export const BOLD_ELEMENTS: ElementKey[] = ['title', 'student_name', 'course_title'];
export const META_ELEMENTS: ElementKey[] = ['issued_at', 'certificate_number', 'instructor_name', 'signature_name'];
export const TEXT_EDITABLE: ElementKey[] = ['title', 'subtitle', 'completion_text', 'footer_note'];

export const ELEMENT_DEFAULTS: Record<FixedElementKey, ElementConfig> = {
    title: {
        x: 50,
        y: 18,
        fontSize: 14,
        color: '#6b7280',
        align: 'center',
        visible: true,
        text: 'Certificate of Completion',
        label: 'Title',
    },
    subtitle: {
        x: 50,
        y: 28,
        fontSize: 10,
        color: '#6b7280',
        align: 'center',
        visible: true,
        text: 'This certifies that',
        label: 'Subtitle',
    },
    student_name: {
        x: 50,
        y: 38,
        fontSize: 38,
        color: '#111827',
        align: 'center',
        visible: true,
        label: 'Student Name',
    },
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
    course_title: {
        x: 50,
        y: 56,
        fontSize: 22,
        color: '#7c3aed',
        align: 'center',
        visible: true,
        label: 'Course Title',
    },
    issued_at: {
        x: 25,
        y: 72,
        fontSize: 11,
        color: '#374151',
        align: 'center',
        visible: true,
        label: 'Issued Date',
        prefix: 'Issued On',
    },
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
    instructor_name: {
        x: 75,
        y: 72,
        fontSize: 11,
        color: '#374151',
        align: 'center',
        visible: true,
        label: 'Instructor',
        prefix: 'Instructor',
    },
    signature_name: {
        x: 50,
        y: 80,
        fontSize: 11,
        color: '#374151',
        align: 'center',
        visible: false,
        label: 'Signature Name',
        prefix: 'Instructor',
    },
    footer_note: {
        x: 50,
        y: 86,
        fontSize: 9,
        color: '#6b7280',
        align: 'center',
        visible: true,
        label: 'Footer Note',
        text: '',
    },
};

export const CUSTOM_ELEMENT_DEFAULT: ElementConfig = {
    x: 50,
    y: 50,
    fontSize: 14,
    color: '#111827',
    align: 'center',
    visible: true,
    text: 'Your text here',
    label: 'Text',
};

export function isCustomElementKey(key: ElementKey): key is CustomElementKey {
    return key.startsWith('custom_');
}

export function elementDefaults(key: ElementKey): ElementConfig {
    return isCustomElementKey(key) ? { ...CUSTOM_ELEMENT_DEFAULT } : { ...ELEMENT_DEFAULTS[key] };
}

export function isTextEditableKey(key: ElementKey): boolean {
    return isCustomElementKey(key) || TEXT_EDITABLE.includes(key);
}

export function createCustomElementKey(existing: Record<string, unknown>): CustomElementKey {
    let suffix = Date.now().toString(36);

    while (`custom_${suffix}` in existing) {
        suffix += Math.floor(Math.random() * 10);
    }

    return `custom_${suffix}`;
}

export interface LayoutPreset {
    id: string;
    name: string;
    hint: string;
    primary_color: string;
    accent_color: string;
    bg_style: BgStyle;
    elements: Partial<Record<ElementKey, Partial<ElementConfig>>>;
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
    {
        id: 'aurora',
        name: 'Aurora',
        hint: 'Centered · modern',
        primary_color: '#7c3aed',
        accent_color: '#a78bfa',
        bg_style: 'dark',
        elements: {
            title: { y: 14, fontSize: 13, color: '#a78bfa', align: 'center', visible: true },
            subtitle: { y: 25, fontSize: 9.5, color: '#94a3b8', align: 'center', visible: true },
            student_name: { y: 37, fontSize: 40, color: '#f8fafc', align: 'center', visible: true },
            completion_text: { y: 48, fontSize: 9.5, color: '#94a3b8', align: 'center', visible: true },
            course_title: { y: 56, fontSize: 22, color: '#c4b5fd', align: 'center', visible: true },
            issued_at: { x: 26, y: 74, fontSize: 10, color: '#94a3b8', align: 'center', visible: true },
            certificate_number: { x: 50, y: 74, fontSize: 9, color: '#a78bfa', align: 'center', visible: true },
            instructor_name: { x: 74, y: 74, fontSize: 10, color: '#94a3b8', align: 'center', visible: true },
            signature_name: { x: 50, y: 82, fontSize: 10, color: '#cbd5e1', align: 'center', visible: false },
            footer_note: { y: 88, fontSize: 8.5, color: '#64748b', align: 'center', visible: true },
        },
    },
    {
        id: 'ivory',
        name: 'Ivory',
        hint: 'Elegant · classic',
        primary_color: '#6d28d9',
        accent_color: '#c4b5fd',
        bg_style: 'light',
        elements: {
            title: { y: 12, fontSize: 12, color: '#8b5cf6', align: 'center', visible: true },
            subtitle: { y: 23, fontSize: 9, color: '#94a3b8', align: 'center', visible: true },
            student_name: { y: 36, fontSize: 42, color: '#111827', align: 'center', visible: true },
            completion_text: { y: 47, fontSize: 9, color: '#94a3b8', align: 'center', visible: true },
            course_title: { y: 55, fontSize: 20, color: '#6d28d9', align: 'center', visible: true },
            issued_at: { x: 25, y: 73, fontSize: 10, color: '#64748b', align: 'center', visible: true },
            certificate_number: { x: 50, y: 73, fontSize: 9, color: '#7c3aed', align: 'center', visible: true },
            instructor_name: { x: 75, y: 73, fontSize: 10, color: '#64748b', align: 'center', visible: true },
            signature_name: { x: 50, y: 82, fontSize: 10, color: '#475569', align: 'center', visible: false },
            footer_note: { y: 89, fontSize: 8, color: '#94a3b8', align: 'center', visible: true },
        },
    },
    {
        id: 'editorial',
        name: 'Editorial',
        hint: 'Left aligned · bold',
        primary_color: '#7c3aed',
        accent_color: '#a78bfa',
        bg_style: 'light',
        elements: {
            title: { x: 12, y: 14, fontSize: 11, color: '#7c3aed', align: 'left', visible: true },
            subtitle: { x: 12, y: 24, fontSize: 9, color: '#94a3b8', align: 'left', visible: true },
            student_name: { x: 12, y: 37, fontSize: 44, color: '#0f172a', align: 'left', visible: true },
            completion_text: { x: 12, y: 49, fontSize: 9.5, color: '#94a3b8', align: 'left', visible: true },
            course_title: { x: 12, y: 57, fontSize: 22, color: '#7c3aed', align: 'left', visible: true },
            issued_at: { x: 12, y: 82, fontSize: 9.5, color: '#475569', align: 'left', visible: true },
            certificate_number: { x: 50, y: 82, fontSize: 9, color: '#7c3aed', align: 'center', visible: true },
            instructor_name: { x: 88, y: 82, fontSize: 9.5, color: '#475569', align: 'right', visible: true },
            signature_name: { x: 88, y: 72, fontSize: 9.5, color: '#475569', align: 'right', visible: false },
            footer_note: { x: 12, y: 91, fontSize: 8, color: '#94a3b8', align: 'left', visible: true },
        },
    },
    {
        id: 'bold',
        name: 'Bold',
        hint: 'Big type · gradient',
        primary_color: '#c026d3',
        accent_color: '#f0abfc',
        bg_style: 'gradient',
        elements: {
            title: { y: 10, fontSize: 11, color: '#f0abfc', align: 'center', visible: true },
            subtitle: { y: 22, fontSize: 9, color: '#cbd5e1', align: 'center', visible: true },
            student_name: { y: 34, fontSize: 50, color: '#fdf4ff', align: 'center', visible: true },
            completion_text: { y: 47, fontSize: 9, color: '#cbd5e1', align: 'center', visible: true },
            course_title: { y: 54, fontSize: 24, color: '#f0abfc', align: 'center', visible: true },
            issued_at: { x: 25, y: 76, fontSize: 9.5, color: '#e9d5ff', align: 'center', visible: true },
            certificate_number: { x: 50, y: 76, fontSize: 9, color: '#f0abfc', align: 'center', visible: true },
            instructor_name: { x: 75, y: 76, fontSize: 9.5, color: '#e9d5ff', align: 'center', visible: true },
            signature_name: { x: 50, y: 84, fontSize: 10, color: '#f5d0fe', align: 'center', visible: false },
            footer_note: { y: 90, fontSize: 8, color: '#c4b5fd', align: 'center', visible: true },
        },
    },
    {
        id: 'academic',
        name: 'Academic',
        hint: 'Formal · signed',
        primary_color: '#1d4ed8',
        accent_color: '#93c5fd',
        bg_style: 'light',
        elements: {
            title: { y: 10, fontSize: 11, color: '#64748b', align: 'center', visible: true },
            subtitle: { y: 22, fontSize: 9, color: '#94a3b8', align: 'center', visible: true },
            student_name: { y: 34, fontSize: 40, color: '#0f172a', align: 'center', visible: true },
            completion_text: { y: 45, fontSize: 9, color: '#94a3b8', align: 'center', visible: true },
            course_title: { y: 53, fontSize: 20, color: '#1d4ed8', align: 'center', visible: true },
            issued_at: { x: 24, y: 70, fontSize: 9.5, color: '#475569', align: 'center', visible: true },
            certificate_number: { x: 50, y: 70, fontSize: 8.5, color: '#1d4ed8', align: 'center', visible: true },
            instructor_name: { x: 76, y: 70, fontSize: 9.5, color: '#475569', align: 'center', visible: false },
            signature_name: { x: 50, y: 82, fontSize: 11, color: '#1e293b', align: 'center', visible: true },
            footer_note: { y: 91, fontSize: 8, color: '#94a3b8', align: 'center', visible: true },
        },
    },
    {
        id: 'minimal',
        name: 'Minimal',
        hint: 'Airy · clean',
        primary_color: '#0f766e',
        accent_color: '#5eead4',
        bg_style: 'light',
        elements: {
            title: { y: 12, fontSize: 10, color: '#94a3b8', align: 'center', visible: true },
            subtitle: { y: 30, fontSize: 9, color: '#94a3b8', align: 'center', visible: true },
            student_name: { y: 40, fontSize: 46, color: '#0f172a', align: 'center', visible: true },
            completion_text: { y: 52, fontSize: 9, color: '#94a3b8', align: 'center', visible: true },
            course_title: { y: 59, fontSize: 20, color: '#0f766e', align: 'center', visible: true },
            issued_at: { x: 20, y: 80, fontSize: 9, color: '#64748b', align: 'center', visible: true },
            certificate_number: { x: 50, y: 80, fontSize: 8.5, color: '#0f766e', align: 'center', visible: true },
            instructor_name: { x: 80, y: 80, fontSize: 9, color: '#64748b', align: 'center', visible: true },
            signature_name: { x: 50, y: 88, fontSize: 10, color: '#475569', align: 'center', visible: false },
            footer_note: { y: 91, fontSize: 8, color: '#94a3b8', align: 'center', visible: true },
        },
    },
];

export const COLOR_PALETTES = [
    { name: 'Violet', primary: '#7c3aed', accent: '#a78bfa' },
    { name: 'Indigo', primary: '#4f46e5', accent: '#818cf8' },
    { name: 'Blue', primary: '#2563eb', accent: '#60a5fa' },
    { name: 'Teal', primary: '#0d9488', accent: '#5eead4' },
    { name: 'Emerald', primary: '#059669', accent: '#6ee7b7' },
    { name: 'Amber', primary: '#d97706', accent: '#fbbf24' },
    { name: 'Rose', primary: '#e11d48', accent: '#fb7185' },
    { name: 'Fuchsia', primary: '#c026d3', accent: '#f0abfc' },
];

export function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

export function round(value: number, digits = 1) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}

export function isHexColor(value: string) {
    return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function normalizeTemplate(raw: RawTemplate | null | undefined): CertificateTemplate {
    const source = raw ?? {};
    const elements = {} as Record<ElementKey, ElementConfig>;

    for (const key of ELEMENT_ORDER) {
        const def = ELEMENT_DEFAULTS[key];
        const input = source.elements?.[key] ?? {};

        elements[key] = {
            ...def,
            x: clamp(Number(input.x ?? def.x), 0, 100),
            y: clamp(Number(input.y ?? def.y), 0, 100),
            fontSize: clamp(Number(input.fontSize ?? def.fontSize), 6, 120),
            color: typeof input.color === 'string' && isHexColor(input.color) ? input.color : def.color,
            align: input.align === 'left' || input.align === 'right' || input.align === 'center' ? input.align : def.align,
            visible: typeof input.visible === 'boolean' ? input.visible : def.visible,
            label: def.label,
            prefix: def.prefix,
            text: typeof input.text === 'string' ? input.text : def.text,
        };
    }

    let customCount = 0;
    for (const [key, value] of Object.entries(source.elements ?? {})) {
        if (!isCustomElementKey(key as ElementKey) || customCount >= 24) continue;
        if (!value || typeof value !== 'object') continue;

        const input = value as Partial<ElementConfig>;
        const def = CUSTOM_ELEMENT_DEFAULT;

        elements[key as CustomElementKey] = {
            ...def,
            x: clamp(Number(input.x ?? def.x), 0, 100),
            y: clamp(Number(input.y ?? def.y), 0, 100),
            fontSize: clamp(Number(input.fontSize ?? def.fontSize), 6, 120),
            color: typeof input.color === 'string' && isHexColor(input.color) ? input.color : def.color,
            align: input.align === 'left' || input.align === 'right' || input.align === 'center' ? input.align : def.align,
            visible: typeof input.visible === 'boolean' ? input.visible : def.visible,
            label: typeof input.label === 'string' && input.label ? input.label : def.label,
            text: typeof input.text === 'string' ? input.text.slice(0, 200) : def.text,
        };
        customCount += 1;
    }

    if (typeof source.custom_title === 'string' && source.custom_title) {
        elements.title.text = source.custom_title;
    }
    if (typeof source.footer_note === 'string') {
        elements.footer_note.text = source.footer_note;
    }
    if (typeof source.show_signature === 'boolean') {
        elements.signature_name.visible = source.show_signature;
    }

    return {
        mode: source.background_path ? 'custom' : (source.mode ?? 'default'),
        background_path: source.background_path ?? null,
        background_url: source.background_url ?? null,
        primary_color: typeof source.primary_color === 'string' && isHexColor(source.primary_color) ? source.primary_color : '#7c3aed',
        accent_color: typeof source.accent_color === 'string' && isHexColor(source.accent_color) ? source.accent_color : '#a78bfa',
        bg_style: source.bg_style === 'light' || source.bg_style === 'gradient' ? source.bg_style : 'dark',
        show_signature: Boolean(source.show_signature),
        signature_name: source.signature_name ?? '',
        signature_image: typeof source.signature_image === 'string' && source.signature_image ? source.signature_image : null,
        signature_image_url: typeof source.signature_image_url === 'string' && source.signature_image_url ? source.signature_image_url : null,
        custom_title: source.custom_title ?? elements.title.text ?? '',
        footer_note: source.footer_note ?? elements.footer_note.text ?? '',
        elements,
    };
}

export function applyLayoutPreset(template: CertificateTemplate, preset: LayoutPreset): CertificateTemplate {
    const elements = {} as Record<ElementKey, ElementConfig>;

    for (const key of ELEMENT_ORDER) {
        const override = preset.elements[key] ?? {};
        const currentText = template.elements[key].text;

        elements[key] = {
            ...ELEMENT_DEFAULTS[key],
            ...override,
            text: override.text ?? currentText,
            label: ELEMENT_DEFAULTS[key].label,
            prefix: ELEMENT_DEFAULTS[key].prefix,
        };
    }

    for (const [key, element] of Object.entries(template.elements)) {
        if (isCustomElementKey(key as ElementKey)) {
            elements[key as CustomElementKey] = element;
        }
    }

    return {
        ...template,
        primary_color: preset.primary_color,
        accent_color: preset.accent_color,
        bg_style: preset.bg_style,
        show_signature: Boolean(elements.signature_name.visible),
        elements,
    };
}

export function previewTemplate(preset: LayoutPreset): CertificateTemplate {
    return applyLayoutPreset(normalizeTemplate(null), preset);
}

export interface PreviewValues {
    student_name: string;
    course_title: string;
    certificate_number: string;
    issued_at: string;
    instructor_name: string;
    brand_name: string;
    signature_name: string;
}

export function resolveElementText(key: ElementKey, element: ElementConfig, template: CertificateTemplate, values: PreviewValues): string {
    switch (key) {
        case 'title':
            return element.text || template.custom_title || 'Certificate of Completion';
        case 'subtitle':
            return element.text || 'This certifies that';
        case 'completion_text':
            return element.text || 'has successfully completed';
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
            return template.signature_name || values.signature_name || values.instructor_name;
        case 'footer_note':
            return element.text || template.footer_note || '';
        default:
            return element.text || '';
    }
}

export function displayText(key: ElementKey, text: string, element: ElementConfig) {
    if (META_ELEMENTS.includes(key) && element.prefix) {
        return `${element.prefix}\n${text}`;
    }

    return text;
}

const FONT_STACK = '"Instrument Sans", ui-sans-serif, system-ui, sans-serif';
let measureContext: CanvasRenderingContext2D | null = null;

function getMeasureContext() {
    if (typeof document === 'undefined') return null;
    if (!measureContext) {
        measureContext = document.createElement('canvas').getContext('2d');
    }
    return measureContext;
}

export function measureTextWidth(text: string, fontSize: number, bold = false): number {
    const ctx = getMeasureContext();
    if (!ctx) return text.length * fontSize * 0.52;

    ctx.font = `${bold ? 700 : 400} ${fontSize}px ${FONT_STACK}`;
    return ctx.measureText(text || ' ').width;
}

export interface ElementBox {
    left: number;
    top: number;
    width: number;
    height: number;
    anchorX: number;
    anchorY: number;
    offsetX: number;
    offsetY: number;
}

/**
 * Approximate the visible text box in canvas pixels. Mirrors the PDF layout:
 * a 72% wide text block anchored at the element position based on alignment.
 */
export function measureElementBox(key: ElementKey, element: ElementConfig, text: string): ElementBox {
    const maxWidth = CANVAS_W * 0.72;
    const anchorX = (element.x / 100) * CANVAS_W;
    const anchorY = (element.y / 100) * CANVAS_H;
    const bold = BOLD_ELEMENTS.includes(key);
    const isMeta = META_ELEMENTS.includes(key);
    const prefix = isMeta ? (element.prefix ?? '') : '';

    const valueWidth = measureTextWidth(text, element.fontSize, bold);
    const labelFontSize = Math.max(6, element.fontSize * 0.72);
    const labelWidth = prefix ? measureTextWidth(prefix.toUpperCase(), labelFontSize, false) : 0;
    const contentWidth = Math.min(Math.max(valueWidth, labelWidth), maxWidth);

    const valueLineHeight = element.fontSize * 1.2;
    const wrappedLines = Math.max(1, Math.ceil(valueWidth / maxWidth));
    const valueHeight = wrappedLines * valueLineHeight;
    const labelHeight = prefix ? labelFontSize * 1.2 + 3 : 0;
    const height = valueHeight + labelHeight;

    const offsetX = element.align === 'left' ? 0 : element.align === 'right' ? maxWidth : maxWidth / 2;
    const left = anchorX - (element.align === 'center' ? contentWidth / 2 : element.align === 'right' ? contentWidth : 0);
    const top = anchorY - height / 2;

    return {
        left,
        top,
        width: contentWidth,
        height,
        anchorX,
        anchorY,
        offsetX,
        offsetY: height / 2,
    };
}
