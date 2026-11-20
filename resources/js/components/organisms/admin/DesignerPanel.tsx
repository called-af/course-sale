import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Eye,
    EyeOff,
    ImagePlus,
    LayoutTemplate,
    Palette,
    PenLine,
    Plus,
    RotateCcw,
    Trash2,
    Type,
    UploadCloud,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { DragEvent, ReactNode } from 'react';

import {
    BOLD_ELEMENTS,
    CANVAS_H,
    CANVAS_W,
    COLOR_PALETTES,
    ELEMENT_ORDER,
    LAYOUT_PRESETS,
    META_ELEMENTS,
    isCustomElementKey,
    isTextEditableKey,
    previewTemplate,
    resolveElementText,
} from './certificate-designer-utils';
import type { CertificateTemplate, DesignerTab, ElementConfig, ElementKey, LayoutPreset, PreviewValues } from './certificate-designer-utils';

interface DesignerPanelProps {
    tab: DesignerTab;
    template: CertificateTemplate;
    values: PreviewValues;
    selected: ElementKey | null;
    activeBackgroundUrl: string | null;
    hasBackground: boolean;
    backgroundFile: File | null;
    signatureImageUrl: string | null;
    signatureError: string | null;
    onPickSignature: (file: File | null) => void;
    onRemoveSignature: () => void;
    onSelect: (key: ElementKey | null) => void;
    onSetElement: (key: ElementKey, patch: Partial<ElementConfig>) => void;
    onSetField: <K extends keyof CertificateTemplate>(key: K, value: CertificateTemplate[K]) => void;
    onApplyPreset: (preset: LayoutPreset) => void;
    onApplyPalette: (primary: string, accent: string) => void;
    onResetElement: (key: ElementKey) => void;
    onAddText: () => void;
    onDeleteElement: (key: ElementKey) => void;
    onPickBackground: (file: File | null) => void;
    onRemoveBackground: () => void;
}

const PANEL_META: Record<DesignerTab, { title: string; description: string }> = {
    layouts: { title: 'Layouts', description: 'Start from a layout, then fine-tune every element to match your brand.' },
    elements: { title: 'Elements', description: 'Click a layer to edit it, or add your own text to the certificate.' },
    style: { title: 'Style', description: 'Set the palette and the fallback certificate background.' },
    uploads: { title: 'Uploads', description: 'Add certificate artwork and a transparent PNG signature image.' },
};

export default function DesignerPanel({
    tab,
    template,
    values,
    selected,
    activeBackgroundUrl,
    hasBackground,
    backgroundFile,
    signatureImageUrl,
    signatureError,
    onPickSignature,
    onRemoveSignature,
    onSelect,
    onSetElement,
    onSetField,
    onApplyPreset,
    onApplyPalette,
    onResetElement,
    onAddText,
    onDeleteElement,
    onPickBackground,
    onRemoveBackground,
}: DesignerPanelProps) {
    const meta = PANEL_META[tab];

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-neutral-200/80 px-4 py-3.5 dark:border-slate-800">
                <h2 className="text-sm font-bold text-neutral-900 dark:text-slate-100">{meta.title}</h2>
                <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500 dark:text-slate-400">{meta.description}</p>
            </div>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4">
                {tab === 'layouts' && <LayoutsPanel onApplyPreset={onApplyPreset} />}
                {tab === 'elements' && (
                    <ElementsPanel
                        template={template}
                        values={values}
                        selected={selected}
                        hasBackground={Boolean(activeBackgroundUrl)}
                        onSelect={onSelect}
                        onSetElement={onSetElement}
                        onSetField={onSetField}
                        onResetElement={onResetElement}
                        onAddText={onAddText}
                        onDeleteElement={onDeleteElement}
                        signatureImageUrl={signatureImageUrl}
                        signatureError={signatureError}
                        onPickSignature={onPickSignature}
                        onRemoveSignature={onRemoveSignature}
                    />
                )}
                {tab === 'style' && <StylePanel template={template} onSetField={onSetField} onApplyPalette={onApplyPalette} />}
                {tab === 'uploads' && (
                    <UploadsPanel
                        activeBackgroundUrl={activeBackgroundUrl}
                        hasBackground={hasBackground}
                        backgroundFile={backgroundFile}
                        onPickBackground={onPickBackground}
                        onRemoveBackground={onRemoveBackground}
                        signatureImageUrl={signatureImageUrl}
                        signatureError={signatureError}
                        onPickSignature={onPickSignature}
                        onRemoveSignature={onRemoveSignature}
                    />
                )}
            </div>

            <div className="flex items-center justify-between border-t border-neutral-200/80 px-4 py-2 text-[10px] font-medium text-neutral-400 dark:border-slate-800 dark:text-slate-500">
                <span>A4 Landscape</span>
                <span>
                    {CANVAS_W} × {CANVAS_H} px
                </span>
            </div>
        </div>
    );
}

function LayoutsPanel({ onApplyPreset }: { onApplyPreset: (preset: LayoutPreset) => void }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
                {LAYOUT_PRESETS.map((preset) => (
                    <button key={preset.id} type="button" onClick={() => onApplyPreset(preset)} className="group text-left focus:outline-none">
                        <span className="block rounded-none p-[3px] ring-1 ring-neutral-200 transition group-hover:ring-purple-400 group-focus-visible:ring-2 group-focus-visible:ring-purple-500 dark:ring-slate-700">
                            <LayoutThumb preset={preset} />
                        </span>
                        <span className="mt-1.5 flex items-center justify-between gap-1">
                            <span className="truncate text-[11px] font-semibold text-neutral-700 group-hover:text-purple-600 dark:text-slate-200 dark:group-hover:text-purple-400">
                                {preset.name}
                            </span>
                            <span className="flex shrink-0 gap-0.5">
                                <span className="h-2 w-2 rounded-full" style={{ background: preset.primary_color }} />
                                <span className="h-2 w-2 rounded-full" style={{ background: preset.accent_color }} />
                            </span>
                        </span>
                        <span className="block truncate text-[10px] text-neutral-400 dark:text-slate-500">{preset.hint}</span>
                    </button>
                ))}
            </div>

            <div className="flex items-start gap-2 rounded-none bg-neutral-50 px-3 py-2.5 text-[11px] leading-relaxed text-neutral-500 dark:bg-slate-800/60 dark:text-slate-400">
                <LayoutTemplate size={14} className="mt-0.5 shrink-0 text-purple-500" />
                <span>Applying a layout keeps your typed text and only rearranges position, size, and colors. Use undo if you change your mind.</span>
            </div>
        </div>
    );
}

function LayoutThumb({ preset }: { preset: LayoutPreset }) {
    const template = previewTemplate(preset).elements;
    const background =
        preset.bg_style === 'light'
            ? '#fbfaff'
            : preset.bg_style === 'gradient'
              ? 'linear-gradient(135deg, #160e2e 0%, #3b1766 50%, #160e2e 100%)'
              : '#0d0b16';

    return (
        <span className="relative block aspect-[842/595] w-full overflow-hidden rounded-none" style={{ background }}>
            <span className="absolute inset-[4%] rounded-[1px] border" style={{ borderColor: `${preset.accent_color}55` }} />
            {ELEMENT_ORDER.map((key) => {
                const element = template[key];
                if (!element.visible) return null;

                const text = sampleText(key, element);
                if (!text) return null;

                const isMeta = META_ELEMENTS.includes(key);

                return (
                    <span
                        key={key}
                        className="absolute block overflow-hidden whitespace-nowrap"
                        style={{
                            left: `${element.x}%`,
                            top: `${element.y}%`,
                            width: '70%',
                            transform: `translate(${element.align === 'left' ? '0' : element.align === 'right' ? '-100%' : '-50%'}, -50%)`,
                            textAlign: element.align,
                            color: element.color,
                            fontSize: `${Math.max(2.4, element.fontSize * 0.15)}px`,
                            lineHeight: 1.15,
                            fontWeight: BOLD_ELEMENTS.includes(key) ? 700 : 400,
                            letterSpacing: isMeta ? '0.12em' : undefined,
                        }}
                    >
                        {isMeta && element.prefix ? `${element.prefix}: ${text}` : text}
                    </span>
                );
            })}
        </span>
    );
}

function sampleText(key: ElementKey, element: ElementConfig) {
    switch (key) {
        case 'student_name':
            return 'Dimas Aditya';
        case 'course_title':
            return 'Product Design';
        case 'issued_at':
            return '19 Nov 2026';
        case 'certificate_number':
            return 'KRSIO-2026';
        case 'instructor_name':
        case 'signature_name':
            return 'Rizky Pratama';
        default:
            return element.text || '';
    }
}

function ElementsPanel({
    template,
    values,
    selected,
    hasBackground,
    onSelect,
    onSetElement,
    onSetField,
    onResetElement,
    onAddText,
    onDeleteElement,
    signatureImageUrl,
    signatureError,
    onPickSignature,
    onRemoveSignature,
}: {
    template: CertificateTemplate;
    values: PreviewValues;
    selected: ElementKey | null;
    hasBackground: boolean;
    onSelect: (key: ElementKey | null) => void;
    onSetElement: (key: ElementKey, patch: Partial<ElementConfig>) => void;
    onSetField: <K extends keyof CertificateTemplate>(key: K, value: CertificateTemplate[K]) => void;
    onResetElement: (key: ElementKey) => void;
    onAddText: () => void;
    onDeleteElement: (key: ElementKey) => void;
    signatureImageUrl: string | null;
    signatureError: string | null;
    onPickSignature: (file: File | null) => void;
    onRemoveSignature: () => void;
}) {
    const selectedElement = selected ? template.elements[selected] : null;
    const layerKeys: ElementKey[] = [
        ...ELEMENT_ORDER,
        ...Object.keys(template.elements).filter((key) => isCustomElementKey(key as ElementKey)),
    ] as ElementKey[];

    return (
        <div className="space-y-5">
            <button
                type="button"
                onClick={onAddText}
                className="flex w-full items-center justify-center gap-1.5 rounded-none border border-dashed border-purple-300 bg-purple-50/60 py-2 text-[11px] font-bold text-purple-700 transition hover:border-purple-400 hover:bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300 dark:hover:bg-purple-950/50"
            >
                <Plus size={13} /> Add text
            </button>

            <div className="space-y-1">
                {layerKeys.map((key) => {
                    const element = template.elements[key];
                    const text = resolveElementText(key, element, template, values);
                    const isSelected = selected === key;

                    return (
                        <div
                            key={key}
                            className={`flex items-center gap-1 rounded-none pr-1 transition ${
                                isSelected
                                    ? 'bg-purple-50 ring-1 ring-purple-300 dark:bg-purple-950/40 dark:ring-purple-800'
                                    : 'hover:bg-neutral-50 dark:hover:bg-slate-800/60'
                            }`}
                        >
                            <button
                                type="button"
                                onClick={() => onSelect(key)}
                                className="flex min-w-0 flex-1 items-center gap-2.5 px-2 py-2 text-left"
                            >
                                <span
                                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-none ${
                                        isSelected
                                            ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/60 dark:text-purple-300'
                                            : 'bg-neutral-100 text-neutral-500 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                >
                                    <Type size={13} />
                                </span>
                                <span className="min-w-0">
                                    <span className="flex items-center gap-1.5">
                                        <span
                                            className={`truncate text-xs font-semibold ${
                                                element.visible
                                                    ? 'text-neutral-800 dark:text-slate-100'
                                                    : 'text-neutral-400 line-through dark:text-slate-500'
                                            }`}
                                        >
                                            {element.label ?? key}
                                        </span>
                                        {BOLD_ELEMENTS.includes(key) && (
                                            <span className="rounded bg-neutral-100 px-1 text-[9px] font-bold text-neutral-500 dark:bg-slate-800 dark:text-slate-400">
                                                B
                                            </span>
                                        )}
                                    </span>
                                    <span className="mt-0.5 block truncate text-[10px] text-neutral-400 dark:text-slate-500">
                                        {element.visible ? text || 'Empty' : 'Hidden'}
                                    </span>
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onSetElement(key, { visible: !element.visible })}
                                className="grid h-7 w-7 shrink-0 place-items-center rounded-none text-neutral-400 transition hover:bg-neutral-200/70 hover:text-neutral-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                aria-label={element.visible ? `Hide ${element.label}` : `Show ${element.label}`}
                            >
                                {element.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                            </button>
                            {isCustomElementKey(key) ? (
                                <button
                                    type="button"
                                    onClick={() => onDeleteElement(key)}
                                    className="grid h-7 w-7 shrink-0 place-items-center rounded-none text-neutral-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                                    aria-label={`Delete ${element.label ?? 'text'}`}
                                >
                                    <Trash2 size={13} />
                                </button>
                            ) : (
                                element.visible && (
                                    <button
                                        type="button"
                                        onClick={() => onDeleteElement(key)}
                                        className="grid h-7 w-7 shrink-0 place-items-center rounded-none text-neutral-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                                        aria-label={`Remove ${element.label ?? key}`}
                                        title="Remove from certificate (can be re-enabled)"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                )
                            )}
                        </div>
                    );
                })}
            </div>

            {selected && selectedElement ? (
                <div className="md:hidden">
                    <div className="space-y-4 rounded-none border border-neutral-200 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-[#24252b]">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <p className="text-[10px] font-semibold tracking-wider text-purple-600 uppercase dark:text-purple-400">Selected</p>
                                <p className="text-xs font-bold text-neutral-800 dark:text-slate-100">{selectedElement.label ?? selected}</p>
                            </div>
                            <label className="flex cursor-pointer items-center gap-2 text-[11px] font-medium text-neutral-500 dark:text-slate-400">
                                <input
                                    type="checkbox"
                                    checked={selectedElement.visible}
                                    onChange={(event) => onSetElement(selected, { visible: event.target.checked })}
                                    className="h-3.5 w-3.5 accent-purple-600"
                                />
                                Visible
                            </label>
                        </div>

                        {isTextEditableKey(selected) && (
                            <Field label="Text">
                                <input
                                    type="text"
                                    value={selectedElement.text ?? ''}
                                    maxLength={200}
                                    onChange={(event) => onSetElement(selected, { text: event.target.value })}
                                    className="w-full rounded-none border border-neutral-200 bg-white px-2.5 py-2 text-xs text-neutral-800 transition outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-100 dark:focus:ring-purple-900/40"
                                />
                            </Field>
                        )}

                        {selected === 'signature_name' && (
                            <>
                                <Field label="Signature name">
                                    <input
                                        type="text"
                                        value={template.signature_name}
                                        onChange={(event) => onSetField('signature_name', event.target.value)}
                                        placeholder={values.instructor_name}
                                        className="w-full rounded-none border border-neutral-200 bg-white px-2.5 py-2 text-xs text-neutral-800 transition outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-100 dark:focus:ring-purple-900/40"
                                    />
                                    <p className="mt-1 text-[10px] leading-relaxed text-neutral-400">
                                        Global default. Instructors can override this per course.
                                    </p>
                                </Field>

                                <Field label="Signature image">
                                    <SignatureUploadField
                                        url={signatureImageUrl}
                                        error={signatureError}
                                        onPick={onPickSignature}
                                        onRemove={onRemoveSignature}
                                        compact
                                    />
                                </Field>
                            </>
                        )}

                        {!isTextEditableKey(selected) && selected !== 'signature_name' && (
                            <p className="rounded-none bg-neutral-50 px-2.5 py-2 text-[10px] leading-relaxed text-neutral-400 dark:bg-slate-800/60 dark:text-slate-500">
                                Dynamic content — filled from the certificate data when the PDF is generated.
                            </p>
                        )}

                        <Field label="Font size">
                            <div className="flex items-stretch overflow-hidden rounded-none border border-neutral-200 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => onSetElement(selected, { fontSize: Math.max(6, selectedElement.fontSize - 1) })}
                                    className="w-8 shrink-0 bg-neutral-50 text-sm font-bold text-neutral-500 hover:bg-neutral-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    min={6}
                                    max={120}
                                    value={selectedElement.fontSize}
                                    onChange={(event) => {
                                        const next = Number(event.target.value);
                                        if (Number.isFinite(next)) onSetElement(selected, { fontSize: Math.max(6, Math.min(120, next)) });
                                    }}
                                    className="min-w-0 flex-1 bg-white px-2 py-1.5 text-center text-xs font-semibold text-neutral-800 outline-none dark:bg-[#1e1f24] dark:text-slate-100"
                                />
                                <button
                                    type="button"
                                    onClick={() => onSetElement(selected, { fontSize: Math.min(120, selectedElement.fontSize + 1) })}
                                    className="w-8 shrink-0 bg-neutral-50 text-sm font-bold text-neutral-500 hover:bg-neutral-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    +
                                </button>
                            </div>
                        </Field>

                        <div className="grid grid-cols-2 gap-2.5">
                            <Field label="Text color">
                                <label className="relative flex cursor-pointer items-center gap-2 rounded-none border border-neutral-200 px-2 py-1.5 dark:border-slate-700">
                                    <span className="h-5 w-5 shrink-0 rounded ring-1 ring-black/10" style={{ background: selectedElement.color }} />
                                    <span className="truncate font-mono text-[10px] font-semibold text-neutral-500 uppercase dark:text-slate-400">
                                        {selectedElement.color}
                                    </span>
                                    <input
                                        type="color"
                                        value={selectedElement.color}
                                        onChange={(event) => onSetElement(selected, { color: event.target.value })}
                                        className="absolute inset-0 cursor-pointer opacity-0"
                                    />
                                </label>
                            </Field>
                            <Field label="Alignment">
                                <div className="flex overflow-hidden rounded-none border border-neutral-200 dark:border-slate-700">
                                    {(
                                        [
                                            { value: 'left', icon: AlignLeft },
                                            { value: 'center', icon: AlignCenter },
                                            { value: 'right', icon: AlignRight },
                                        ] as const
                                    ).map((option) => {
                                        const Icon = option.icon;
                                        const active = selectedElement.align === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => onSetElement(selected, { align: option.value })}
                                                className={`flex flex-1 items-center justify-center py-1.5 ${
                                                    active
                                                        ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-300'
                                                        : 'text-neutral-400 hover:bg-neutral-50 dark:hover:bg-slate-800'
                                                }`}
                                                aria-label={`Align ${option.value}`}
                                            >
                                                <Icon size={14} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </Field>
                        </div>

                        {!hasBackground && !isCustomElementKey(selected) && (
                            <p className="text-[10px] leading-relaxed text-neutral-400 dark:text-slate-500">
                                Text colors apply to uploaded artwork. The built-in canvas uses your Style palette instead.
                            </p>
                        )}

                        <div className="grid grid-cols-2 gap-2.5">
                            <NumberField
                                label="Position X"
                                value={selectedElement.x}
                                min={0}
                                max={100}
                                step={0.5}
                                onChange={(value) => onSetElement(selected, { x: value })}
                            />
                            <NumberField
                                label="Position Y"
                                value={selectedElement.y}
                                min={0}
                                max={100}
                                step={0.5}
                                onChange={(value) => onSetElement(selected, { y: value })}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => onResetElement(selected)}
                            className="flex w-full items-center justify-center gap-1.5 rounded-none border border-neutral-200 py-1.5 text-[11px] font-semibold text-neutral-500 transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                            <RotateCcw size={12} /> Reset element
                        </button>

                        <button
                            type="button"
                            onClick={() => onDeleteElement(selected)}
                            className="flex w-full items-center justify-center gap-1.5 rounded-none border border-rose-200 py-1.5 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40"
                        >
                            <Trash2 size={12} /> {isCustomElementKey(selected) ? 'Delete text' : 'Remove element'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="rounded-none border border-dashed border-neutral-200 px-3 py-6 text-center md:hidden dark:border-slate-700">
                    <Type size={18} className="mx-auto text-neutral-300 dark:text-slate-600" />
                    <p className="mt-2 text-[11px] leading-relaxed text-neutral-400 dark:text-slate-500">
                        Click any text on the canvas, or pick a layer above, to edit its content and style.
                    </p>
                </div>
            )}

            <p className="hidden rounded-none bg-neutral-50 px-3 py-2 text-[10px] leading-relaxed text-neutral-500 md:block dark:bg-slate-800/60 dark:text-slate-400">
                Select a layer — its text, font, color, and position are edited in the toolbar above the canvas.
            </p>
        </div>
    );
}

function StylePanel({
    template,
    onSetField,
    onApplyPalette,
}: {
    template: CertificateTemplate;
    onSetField: <K extends keyof CertificateTemplate>(key: K, value: CertificateTemplate[K]) => void;
    onApplyPalette: (primary: string, accent: string) => void;
}) {
    return (
        <div className="space-y-6">
            <div className="space-y-2.5">
                <SectionTitle icon={<Palette size={13} />} label="Quick palette" />
                <div className="grid grid-cols-2 gap-1.5">
                    {COLOR_PALETTES.map((palette) => {
                        const active = template.primary_color === palette.primary && template.accent_color === palette.accent;
                        return (
                            <button
                                key={palette.name}
                                type="button"
                                onClick={() => onApplyPalette(palette.primary, palette.accent)}
                                className={`flex items-center gap-2 rounded-none border px-2 py-1.5 text-left transition ${
                                    active
                                        ? 'border-purple-400 bg-purple-50 dark:border-purple-700 dark:bg-purple-950/40'
                                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 dark:border-slate-700 dark:hover:bg-slate-800'
                                }`}
                            >
                                <span className="flex shrink-0 -space-x-1">
                                    <span
                                        className="h-4 w-4 rounded-full ring-1 ring-white dark:ring-[#24252b]"
                                        style={{ background: palette.primary }}
                                    />
                                    <span
                                        className="h-4 w-4 rounded-full ring-1 ring-white dark:ring-[#24252b]"
                                        style={{ background: palette.accent }}
                                    />
                                </span>
                                <span className="truncate text-[11px] font-semibold text-neutral-600 dark:text-slate-300">{palette.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-2.5">
                <SectionTitle icon={<Palette size={13} />} label="Brand colors" />
                <div className="grid grid-cols-2 gap-2.5">
                    <ColorField label="Primary" value={template.primary_color} onChange={(value) => onSetField('primary_color', value)} />
                    <ColorField label="Accent" value={template.accent_color} onChange={(value) => onSetField('accent_color', value)} />
                </div>
                <p className="text-[10px] leading-relaxed text-neutral-400 dark:text-slate-500">
                    Used by the built-in certificate artwork and PDF accents when no custom background is uploaded.
                </p>
            </div>

            <div className="space-y-2.5">
                <SectionTitle icon={<LayoutTemplate size={13} />} label="Background style" />
                <div className="grid grid-cols-3 gap-1.5">
                    {(
                        [
                            { value: 'dark', label: 'Dark', preview: 'linear-gradient(135deg,#0d0b16,#241447)' },
                            { value: 'light', label: 'Light', preview: 'linear-gradient(135deg,#ffffff,#f3ecff)' },
                            { value: 'gradient', label: 'Gradient', preview: 'linear-gradient(135deg,#160e2e,#5b21b6,#160e2e)' },
                        ] as const
                    ).map((option) => {
                        const active = template.bg_style === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onSetField('bg_style', option.value)}
                                className={`rounded-none border p-1.5 text-left transition ${
                                    active
                                        ? 'border-purple-400 ring-2 ring-purple-100 dark:border-purple-600 dark:ring-purple-900/50'
                                        : 'border-neutral-200 hover:border-neutral-300 dark:border-slate-700'
                                }`}
                            >
                                <span className="block h-10 w-full rounded" style={{ background: option.preview }} />
                                <span className="mt-1 block text-center text-[10px] font-semibold text-neutral-600 dark:text-slate-300">
                                    {option.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function UploadsPanel({
    activeBackgroundUrl,
    hasBackground,
    backgroundFile,
    onPickBackground,
    onRemoveBackground,
    signatureImageUrl,
    signatureError,
    onPickSignature,
    onRemoveSignature,
}: {
    activeBackgroundUrl: string | null;
    hasBackground: boolean;
    backgroundFile: File | null;
    onPickBackground: (file: File | null) => void;
    onRemoveBackground: () => void;
    signatureImageUrl: string | null;
    signatureError: string | null;
    onPickSignature: (file: File | null) => void;
    onRemoveSignature: () => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const acceptFile = (file: File | null) => {
        if (!file) return;
        if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) return;
        onPickBackground(file);
    };

    const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setDragActive(false);
        acceptFile(event.dataTransfer.files?.[0] ?? null);
    };

    return (
        <div className="space-y-5">
            <div className="space-y-2.5">
                <SectionTitle icon={<ImagePlus size={13} />} label="Certificate background" />

                {activeBackgroundUrl ? (
                    <div className="overflow-hidden rounded-none border border-neutral-200 dark:border-slate-700">
                        <div className="relative aspect-[842/595] bg-neutral-100 dark:bg-slate-800">
                            <img src={activeBackgroundUrl} alt="Certificate background" className="h-full w-full object-cover" />
                            {backgroundFile && (
                                <span className="absolute top-2 left-2 rounded-none bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                                    Unsaved upload
                                </span>
                            )}
                        </div>
                        <div className="flex gap-1.5 border-t border-neutral-200 p-2 dark:border-slate-700">
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="flex flex-1 items-center justify-center gap-1.5 rounded-none bg-purple-600 py-1.5 text-[11px] font-semibold text-white transition hover:bg-purple-700"
                            >
                                <UploadCloud size={12} /> Replace
                            </button>
                            <button
                                type="button"
                                onClick={onRemoveBackground}
                                className="flex items-center justify-center gap-1.5 rounded-none border border-red-200 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                            >
                                <Trash2 size={12} /> Remove
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(event) => {
                            event.preventDefault();
                            setDragActive(true);
                        }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={handleDrop}
                        className={`flex w-full flex-col items-center justify-center rounded-none border-2 border-dashed px-4 py-8 text-center transition ${
                            dragActive
                                ? 'border-purple-400 bg-purple-50 dark:border-purple-500 dark:bg-purple-950/30'
                                : 'border-neutral-200 bg-neutral-50/60 hover:border-purple-300 hover:bg-purple-50/40 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-purple-700'
                        }`}
                    >
                        <span className="grid h-11 w-11 place-items-center rounded-none bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300">
                            <UploadCloud size={19} />
                        </span>
                        <span className="mt-3 text-xs font-semibold text-neutral-700 dark:text-slate-200">Upload an image</span>
                        <span className="mt-1 text-[10px] leading-relaxed text-neutral-400 dark:text-slate-500">
                            Drag &amp; drop, or click to browse.
                            <br />
                            PNG, JPG, or WebP · up to 5 MB
                        </span>
                    </button>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(event) => {
                        acceptFile(event.target.files?.[0] ?? null);
                        event.target.value = '';
                    }}
                />
            </div>

            <div className="space-y-2.5">
                <SectionTitle icon={<PenLine size={13} />} label="Instructor signature" />
                <SignatureUploadField url={signatureImageUrl} error={signatureError} onPick={onPickSignature} onRemove={onRemoveSignature} />
                <p className="text-[10px] leading-relaxed text-neutral-400 dark:text-slate-500">
                    This is the global default. Instructors can replace it with their own PNG for their courses.
                </p>
            </div>

            <div className="space-y-1.5 rounded-none bg-neutral-50 px-3 py-2.5 text-[10px] leading-relaxed text-neutral-500 dark:bg-slate-800/60 dark:text-slate-400">
                <p className="font-semibold text-neutral-600 dark:text-slate-300">Tips for crisp certificates</p>
                <p>Use an A4 landscape image (ratio 842 × 595, ideally 3508 × 2480 px). Text layers are printed on top of your artwork.</p>
            </div>

            {hasBackground && !activeBackgroundUrl && (
                <div className="flex items-start gap-2 rounded-none border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                    <Trash2 size={13} className="mt-0.5 shrink-0" />
                    <span>The current background will be removed when you save.</span>
                </div>
            )}
        </div>
    );
}

function SignatureUploadField({
    url,
    error,
    onPick,
    onRemove,
    compact = false,
}: {
    url: string | null;
    error: string | null;
    onPick: (file: File | null) => void;
    onRemove: () => void;
    compact?: boolean;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-2">
            <div
                className={`relative overflow-hidden rounded-none border border-neutral-200 dark:border-slate-700 ${compact ? 'h-20' : 'aspect-[5/2]'}`}
                style={{
                    backgroundImage: 'conic-gradient(#e5e7eb 0 25%, #ffffff 0 50%, #e5e7eb 0 75%, #ffffff 0)',
                    backgroundSize: '14px 14px',
                }}
            >
                {url ? (
                    <img src={url} alt="Signature preview" className="h-full w-full object-contain" />
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1 text-neutral-400 dark:text-slate-500">
                        <PenLine size={compact ? 16 : 22} />
                        <span className="text-[10px] font-medium">No signature image</span>
                    </div>
                )}
            </div>

            <div className="flex gap-1.5">
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-none bg-purple-600 py-1.5 text-[11px] font-semibold text-white transition hover:bg-purple-700"
                >
                    <UploadCloud size={12} /> {url ? 'Replace' : 'Upload PNG'}
                </button>
                {url && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="flex items-center justify-center gap-1.5 rounded-none border border-red-200 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                        <Trash2 size={12} /> Remove
                    </button>
                )}
            </div>

            {!compact && (
                <p className="text-[10px] leading-relaxed text-neutral-400 dark:text-slate-500">Transparent PNG only · no background · max 2 MB</p>
            )}
            {error && <p className="text-[10px] leading-relaxed text-red-600 dark:text-red-400">{error}</p>}

            <input
                ref={inputRef}
                type="file"
                accept="image/png"
                className="hidden"
                onChange={(event) => {
                    onPick(event.target.files?.[0] ?? null);
                    event.target.value = '';
                }}
            />
        </div>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <label className="mb-1 block text-[10px] font-semibold tracking-wide text-neutral-500 uppercase dark:text-slate-400">{label}</label>
            {children}
        </div>
    );
}

function NumberField({
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
    onChange: (value: number) => void;
}) {
    return (
        <Field label={label}>
            <div className="flex items-center rounded-none border border-neutral-200 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-[#1e1f24]">
                <input
                    type="number"
                    value={value}
                    min={min}
                    max={max}
                    step={step}
                    onChange={(event) => {
                        const next = Number(event.target.value);
                        if (Number.isFinite(next)) onChange(Math.max(min, Math.min(max, next)));
                    }}
                    className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-neutral-800 outline-none dark:text-slate-100"
                />
                <span className="ml-1 text-[10px] font-semibold text-neutral-400">%</span>
            </div>
        </Field>
    );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <Field label={label}>
            <label className="relative flex cursor-pointer items-center gap-2 rounded-none border border-neutral-200 px-2 py-1.5 dark:border-slate-700">
                <span className="h-5 w-5 shrink-0 rounded ring-1 ring-black/10" style={{ background: value }} />
                <span className="truncate font-mono text-[10px] font-semibold text-neutral-500 uppercase dark:text-slate-400">{value}</span>
                <input
                    type="color"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                />
            </label>
        </Field>
    );
}

function SectionTitle({ icon, label }: { icon: ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-1.5 text-neutral-500 dark:text-slate-400">
            <span className="text-purple-500">{icon}</span>
            <span className="text-[10px] font-bold tracking-wider uppercase">{label}</span>
        </div>
    );
}
