import { Link, router } from '@inertiajs/react';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    ArrowLeft,
    Award,
    Eye,
    EyeOff,
    ImagePlus,
    LayoutTemplate,
    Maximize2,
    Minus,
    Palette,
    Plus,
    Redo2,
    RotateCcw,
    Save,
    Trash2,
    Type,
    Undo2,
    X,
    ZoomIn,
    ZoomOut,
    type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Button from '@/components/atoms/Button';
import { useBranding } from '@/hooks/useBranding';
import { validateTransparentPng } from '@/lib/transparent-png';

import {
    CANVAS_H,
    CANVAS_W,
    CUSTOM_ELEMENT_DEFAULT,
    applyLayoutPreset,
    clamp,
    createCustomElementKey,
    elementDefaults,
    isCustomElementKey,
    isTextEditableKey,
    normalizeTemplate,
} from './certificate-designer-utils';
import type {
    CertificateTemplate,
    DesignerTab,
    ElementConfig,
    ElementKey,
    LayoutPreset,
    PreviewValues,
    RawTemplate,
} from './certificate-designer-utils';
import DesignerCanvas from './DesignerCanvas';
import DesignerPanel from './DesignerPanel';

interface CertificateDesignerProps {
    initialTemplate: RawTemplate;
}

interface EditorState {
    template: CertificateTemplate;
    past: CertificateTemplate[];
    future: CertificateTemplate[];
}

const TABS: { id: DesignerTab; label: string; icon: LucideIcon }[] = [
    { id: 'layouts', label: 'Layouts', icon: LayoutTemplate },
    { id: 'elements', label: 'Elements', icon: Type },
    { id: 'style', label: 'Style', icon: Palette },
    { id: 'uploads', label: 'Uploads', icon: ImagePlus },
];

const HISTORY_LIMIT = 60;

function createEditorState(template: CertificateTemplate): EditorState {
    return { template, past: [], future: [] };
}

export default function CertificateDesigner({ initialTemplate }: CertificateDesignerProps) {
    const { name: brandName } = useBranding();
    const normalized = useMemo(() => normalizeTemplate(initialTemplate), [initialTemplate]);

    const [editor, setEditor] = useState<EditorState>(() => createEditorState(normalized));
    const [tab, setTab] = useState<DesignerTab>('layouts');
    const [selected, setSelected] = useState<ElementKey | null>('student_name');
    const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
    const [removeBackground, setRemoveBackground] = useState(false);
    const [signatureFile, setSignatureFile] = useState<File | null>(null);
    const [removeSignature, setRemoveSignature] = useState(false);
    const [signatureError, setSignatureError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [fitScale, setFitScale] = useState(0.7);
    const [viewport, setViewport] = useState({ width: 1280, height: 800 });

    const workspaceRef = useRef<HTMLDivElement>(null);
    const template = editor.template;

    const previewUrl = useMemo(() => (backgroundFile ? URL.createObjectURL(backgroundFile) : null), [backgroundFile]);
    const signaturePreviewUrl = useMemo(() => (signatureFile ? URL.createObjectURL(signatureFile) : null), [signatureFile]);
    const activeSignatureUrl = removeSignature ? null : signaturePreviewUrl || template.signature_image_url;

    useEffect(
        () => () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        },
        [previewUrl],
    );

    useEffect(
        () => () => {
            if (signaturePreviewUrl) URL.revokeObjectURL(signaturePreviewUrl);
        },
        [signaturePreviewUrl],
    );

    useEffect(() => {
        setEditor(createEditorState(normalized));
        setBackgroundFile(null);
        setRemoveBackground(false);
        setSignatureFile(null);
        setRemoveSignature(false);
        setSignatureError(null);
    }, [normalized]);

    useEffect(() => {
        const element = workspaceRef.current;
        if (!element) return;

        const update = () => {
            const styles = window.getComputedStyle(element);
            const paddingX = parseFloat(styles.paddingLeft || '0') + parseFloat(styles.paddingRight || '0');
            const paddingY = parseFloat(styles.paddingTop || '0') + parseFloat(styles.paddingBottom || '0');
            const availableWidth = Math.max(0, element.clientWidth - paddingX - 4);
            const availableHeight = Math.max(0, element.clientHeight - paddingY - 4);
            const next = Math.min(availableWidth / CANVAS_W, availableHeight / CANVAS_H, 1.5);
            setFitScale(clamp(next, 0.12, 1.5));
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(element);
        window.addEventListener('resize', update);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', update);
        };
    }, []);

    useEffect(() => {
        if (!previewOpen) return;

        const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [previewOpen]);

    const commit = useCallback((updater: (current: CertificateTemplate) => CertificateTemplate) => {
        setEditor((previous) => {
            const next = updater(previous.template);
            if (next === previous.template) return previous;

            return {
                template: next,
                past: [...previous.past, previous.template].slice(-HISTORY_LIMIT),
                future: [],
            };
        });
    }, []);

    const undo = useCallback(() => {
        setEditor((previous) => {
            if (previous.past.length === 0) return previous;

            return {
                template: previous.past[previous.past.length - 1],
                past: previous.past.slice(0, -1),
                future: [previous.template, ...previous.future].slice(0, HISTORY_LIMIT),
            };
        });
    }, []);

    const redo = useCallback(() => {
        setEditor((previous) => {
            if (previous.future.length === 0) return previous;

            return {
                template: previous.future[0],
                past: [...previous.past, previous.template].slice(-HISTORY_LIMIT),
                future: previous.future.slice(1),
            };
        });
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (previewOpen) setPreviewOpen(false);
                else setSelected(null);
                return;
            }

            const target = event.target as HTMLElement | null;
            const isTyping =
                target instanceof HTMLElement &&
                (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);

            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !isTyping) {
                event.preventDefault();
                if (event.shiftKey) redo();
                else undo();
                return;
            }

            if ((event.key === 'Delete' || event.key === 'Backspace') && !isTyping && selected) {
                event.preventDefault();
                commit((current) => {
                    if (!isCustomElementKey(selected)) {
                        return {
                            ...current,
                            elements: { ...current.elements, [selected]: { ...current.elements[selected], visible: false } },
                            show_signature: selected === 'signature_name' ? false : current.show_signature,
                        };
                    }

                    const nextElements = { ...current.elements };
                    delete nextElements[selected];
                    return { ...current, elements: nextElements };
                });
                setSelected(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [commit, previewOpen, redo, selected, undo]);

    const setField = <K extends keyof CertificateTemplate>(key: K, value: CertificateTemplate[K]) => {
        commit((current) => ({ ...current, [key]: value }));
    };

    const setElement = (key: ElementKey, patch: Partial<ElementConfig>) => {
        commit((current) => {
            const nextElements = {
                ...current.elements,
                [key]: { ...current.elements[key], ...patch },
            };

            return {
                ...current,
                elements: nextElements,
                show_signature: key === 'signature_name' ? Boolean(nextElements.signature_name.visible) : current.show_signature,
            };
        });
    };

    const resetElement = (key: ElementKey) => {
        commit((current) => {
            const fallback = elementDefaults(key);
            const nextElements = {
                ...current.elements,
                [key]: isCustomElementKey(key) ? { ...fallback, color: current.elements[key].color } : fallback,
            };

            return {
                ...current,
                elements: nextElements,
                show_signature: key === 'signature_name' ? Boolean(nextElements.signature_name.visible) : current.show_signature,
            };
        });
    };

    const addText = () => {
        const key = createCustomElementKey(template.elements);

        commit((current) => {
            const offset = Object.keys(current.elements).filter((item) => isCustomElementKey(item as ElementKey)).length;

            return {
                ...current,
                elements: {
                    ...current.elements,
                    [key]: {
                        ...CUSTOM_ELEMENT_DEFAULT,
                        color: current.bg_style === 'light' ? '#111827' : '#f8fafc',
                        y: clamp(62 + offset * 5, 24, 88),
                        label: `Text ${offset + 1}`,
                    },
                },
            };
        });

        setSelected(key);
        setTab('elements');
    };

    const deleteElement = (key: ElementKey) => {
        commit((current) => {
            if (!isCustomElementKey(key)) {
                return {
                    ...current,
                    elements: { ...current.elements, [key]: { ...current.elements[key], visible: false } },
                    show_signature: key === 'signature_name' ? false : current.show_signature,
                };
            }

            const nextElements = { ...current.elements };
            delete nextElements[key];

            return { ...current, elements: nextElements };
        });

        setSelected((current) => (current === key ? null : current));
    };

    const applyPreset = (preset: LayoutPreset) => {
        commit((current) => applyLayoutPreset(current, preset));
    };

    const applyPalette = (primary: string, accent: string) => {
        commit((current) => ({ ...current, primary_color: primary, accent_color: accent }));
    };

    const activeBackgroundUrl = !removeBackground ? previewUrl || template.background_url : null;
    const isCustom = Boolean(activeBackgroundUrl);
    const hasBackground = Boolean(template.background_path || template.background_url);

    const values: PreviewValues = useMemo(
        () => ({
            student_name: 'Dimas Aditya',
            course_title: 'Product Design Mastery',
            certificate_number: 'KRSIO-202611-A1B2C3D4',
            issued_at: '19 November 2026',
            instructor_name: 'Rizky Pratama',
            brand_name: brandName,
            signature_name: template.signature_name || 'Rizky Pratama',
        }),
        [brandName, template.signature_name],
    );

    const scale = clamp(Number((fitScale * zoom).toFixed(3)), 0.12, 3);
    const previewScale = clamp(Math.min((viewport.width - 48) / CANVAS_W, (viewport.height - 132) / CANVAS_H), 0.15, 2);

    const baseline = useMemo(() => JSON.stringify(normalized), [normalized]);
    const current = useMemo(() => JSON.stringify(editor.template), [editor.template]);
    const dirty = current !== baseline || Boolean(backgroundFile) || removeBackground || Boolean(signatureFile) || removeSignature;

    const pickBackground = (file: File | null) => {
        setBackgroundFile(file);
        setRemoveBackground(false);
    };

    const handleRemoveBackground = () => {
        setBackgroundFile(null);
        setRemoveBackground(true);
    };

    const pickSignature = async (file: File | null) => {
        if (!file) return;

        const error = await validateTransparentPng(file);
        setSignatureError(error);
        if (error) return;

        setSignatureFile(file);
        setRemoveSignature(false);
        commit((currentTemplate) => {
            if (currentTemplate.elements.signature_name.visible) return currentTemplate;

            return {
                ...currentTemplate,
                show_signature: true,
                elements: {
                    ...currentTemplate.elements,
                    signature_name: { ...currentTemplate.elements.signature_name, visible: true },
                },
            };
        });
        setSelected('signature_name');
    };

    const handleRemoveSignature = () => {
        setSignatureFile(null);
        setRemoveSignature(true);
        setSignatureError(null);
    };

    const handleCanvasSelect = (key: ElementKey | null) => {
        setSelected(key);
        if (key && window.matchMedia('(max-width: 1023px)').matches) setTab('elements');
    };

    const save = () => {
        const synced: CertificateTemplate = {
            ...template,
            custom_title: template.elements.title.text || '',
            footer_note: template.elements.footer_note.text || '',
            show_signature: Boolean(template.elements.signature_name.visible),
            signature_name: template.signature_name || '',
            mode: isCustom ? 'custom' : 'default',
        };

        const data = new FormData();
        data.append('_method', 'PUT');
        data.append('mode', synced.mode);
        data.append('primary_color', synced.primary_color);
        data.append('accent_color', synced.accent_color);
        data.append('bg_style', synced.bg_style);
        data.append('show_signature', synced.show_signature ? '1' : '0');
        data.append('signature_name', synced.signature_name);
        data.append('custom_title', synced.custom_title);
        data.append('footer_note', synced.footer_note);
        data.append('elements', JSON.stringify(synced.elements));

        if (removeBackground) data.append('remove_background', '1');
        if (backgroundFile) data.append('background_image', backgroundFile);
        if (removeSignature) data.append('remove_signature_image', '1');
        if (signatureFile) data.append('signature_image', signatureFile);

        router.post('/admin/certificate-template', data, {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => {
                setSaving(true);
                setSignatureError(null);
            },
            onFinish: () => setSaving(false),
            onSuccess: () => {
                setBackgroundFile(null);
                setRemoveBackground(false);
                setSignatureFile(null);
                setRemoveSignature(false);
            },
            onError: (formErrors) => setSignatureError(formErrors.signature_image ?? null),
        });
    };

    const resetAll = () => {
        setEditor((previous) => ({
            template: normalized,
            past: [...previous.past, previous.template].slice(-HISTORY_LIMIT),
            future: [],
        }));
        setBackgroundFile(null);
        setRemoveBackground(false);
        setSignatureFile(null);
        setRemoveSignature(false);
        setSignatureError(null);
        setSelected(null);
        setZoom(1);
    };

    const selectedElement = selected ? template.elements[selected] : null;

    return (
        <div className="flex h-dvh flex-col overflow-y-auto bg-[#f1f1f4] lg:overflow-hidden dark:bg-[#101013]">
            <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-neutral-200/90 bg-white px-2.5 sm:px-3 dark:border-slate-800 dark:bg-[#1a1b20]">
                <Link
                    href="/admin/dashboard"
                    title="Exit designer and return to dashboard"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-none text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    aria-label="Back to dashboard"
                >
                    <ArrowLeft size={16} />
                </Link>

                <div className="flex min-w-0 items-center gap-2.5">
                    <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-none bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-sm sm:grid">
                        <Award size={16} />
                    </span>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h1 className="truncate text-sm font-bold text-neutral-900 dark:text-white">Certificate Design</h1>
                            <span className="hidden rounded-none bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-purple-600 uppercase md:inline dark:bg-purple-950/60 dark:text-purple-300">
                                Global
                            </span>
                        </div>
                        <p className="hidden truncate text-[10px] text-neutral-400 sm:block dark:text-slate-500">
                            Applies to all courses · changes regenerate issued PDFs
                        </p>
                    </div>
                </div>

                <div className="mx-auto hidden items-center gap-0.5 md:flex">
                    <IconButton label="Undo (Ctrl+Z)" onClick={undo} disabled={editor.past.length === 0}>
                        <Undo2 size={15} />
                    </IconButton>
                    <IconButton label="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={editor.future.length === 0}>
                        <Redo2 size={15} />
                    </IconButton>

                    <Divider />

                    <IconButton label="Zoom out" onClick={() => setZoom((value) => clamp(Number((value - 0.1).toFixed(2)), 0.4, 2.5))}>
                        <ZoomOut size={15} />
                    </IconButton>
                    <button
                        type="button"
                        onClick={() => setZoom(1)}
                        className="min-w-[44px] rounded-none px-1 py-1 text-center text-[11px] font-bold text-neutral-600 transition hover:bg-neutral-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        title="Reset zoom"
                    >
                        {Math.round(scale * 100)}%
                    </button>
                    <IconButton label="Zoom in" onClick={() => setZoom((value) => clamp(Number((value + 0.1).toFixed(2)), 0.4, 2.5))}>
                        <ZoomIn size={15} />
                    </IconButton>
                    <IconButton label="Fit to screen" onClick={() => setZoom(1)}>
                        <Maximize2 size={14} />
                    </IconButton>
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-1.5">
                    <span
                        className={`hidden items-center gap-1.5 rounded-none px-2.5 py-1 text-[10px] font-semibold sm:inline-flex ${
                            saving
                                ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
                                : dirty
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        }`}
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${saving ? 'animate-pulse bg-sky-500' : dirty ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        />
                        {saving ? 'Saving…' : dirty ? 'Unsaved changes' : 'All changes saved'}
                    </span>

                    <button
                        type="button"
                        onClick={() => setPreviewOpen(true)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-none border border-neutral-200 px-2.5 text-[11px] font-semibold text-neutral-600 transition hover:bg-neutral-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <Eye size={13} /> <span className="hidden sm:inline">Preview</span>
                    </button>

                    <IconButton label="Reset to saved version" onClick={resetAll} disabled={!dirty}>
                        <RotateCcw size={14} />
                    </IconButton>

                    <Button onClick={save} isLoading={saving} size="sm" leftIcon={<Save size={13} />} className="!rounded-none">
                        Save
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
                <nav className="hidden w-[78px] shrink-0 flex-col items-center gap-1 border-r border-neutral-200/90 bg-white px-2 py-3 lg:flex dark:border-slate-800 dark:bg-[#1a1b20]">
                    {TABS.map((item) => {
                        const Icon = item.icon;
                        const active = tab === item.id;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setTab(item.id)}
                                className={`flex w-full flex-col items-center gap-1 rounded-none px-1 py-2.5 transition ${
                                    active
                                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                                        : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                                }`}
                            >
                                <Icon size={19} strokeWidth={1.8} />
                                <span className="text-[10px] font-semibold">{item.label}</span>
                            </button>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => setPreviewOpen(true)}
                        className="mt-auto flex w-full flex-col items-center gap-1 rounded-none px-1 py-2.5 text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                        <Eye size={19} strokeWidth={1.8} />
                        <span className="text-[10px] font-semibold">Preview</span>
                    </button>
                </nav>

                <aside className="hidden w-[298px] shrink-0 border-r border-neutral-200/90 bg-white lg:flex lg:flex-col xl:w-[312px] dark:border-slate-800 dark:bg-[#1a1b20]">
                    <DesignerPanel
                        tab={tab}
                        template={template}
                        values={values}
                        selected={selected}
                        activeBackgroundUrl={activeBackgroundUrl}
                        hasBackground={hasBackground}
                        backgroundFile={backgroundFile}
                        signatureImageUrl={activeSignatureUrl}
                        signatureError={signatureError}
                        onPickSignature={pickSignature}
                        onRemoveSignature={handleRemoveSignature}
                        onSelect={setSelected}
                        onSetElement={setElement}
                        onSetField={setField}
                        onApplyPreset={applyPreset}
                        onApplyPalette={applyPalette}
                        onResetElement={resetElement}
                        onAddText={addText}
                        onDeleteElement={deleteElement}
                        onPickBackground={pickBackground}
                        onRemoveBackground={handleRemoveBackground}
                    />
                </aside>

                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="relative flex h-[44vh] min-h-[320px] flex-col lg:h-auto lg:min-h-0 lg:flex-1">
                        {selected && selectedElement && (
                            <div className="pointer-events-none absolute inset-x-0 top-3 z-20 hidden justify-center px-3 md:flex">
                                <div className="pointer-events-auto w-full max-w-[780px]">
                                    <ContextToolbar
                                        element={selectedElement}
                                        elementKey={selected}
                                        label={selectedElement.label ?? selected}
                                        signatureName={template.signature_name}
                                        signatureImageUrl={activeSignatureUrl}
                                        signatureError={signatureError}
                                        onSetElement={(patch) => setElement(selected, patch)}
                                        onSetSignatureName={(value) => setField('signature_name', value)}
                                        onPickSignature={pickSignature}
                                        onRemoveSignature={handleRemoveSignature}
                                        onReset={() => resetElement(selected)}
                                        onDelete={() => deleteElement(selected)}
                                    />
                                </div>
                            </div>
                        )}

                        <div ref={workspaceRef} className="canvas-dot-grid flex-1 overflow-auto p-4 pb-16 sm:p-6 lg:p-10 lg:pb-24">
                            <div style={{ width: CANVAS_W * scale, height: CANVAS_H * scale, margin: '0 auto' }} className="relative">
                                <div
                                    style={{
                                        transform: `scale(${scale})`,
                                        transformOrigin: 'top left',
                                        width: CANVAS_W,
                                        height: CANVAS_H,
                                    }}
                                    className="overflow-hidden rounded-[3px] bg-white shadow-[0_24px_70px_-24px_rgba(15,23,42,0.55)] ring-1 ring-black/10"
                                >
                                    <DesignerCanvas
                                        template={template}
                                        values={values}
                                        backgroundUrl={activeBackgroundUrl}
                                        signatureImageUrl={activeSignatureUrl}
                                        selected={selected}
                                        brandName={brandName}
                                        onSelect={handleCanvasSelect}
                                        onChange={setElement}
                                    />
                                </div>
                            </div>

                            <p className="mt-4 hidden text-center text-[10px] text-neutral-400 lg:block dark:text-slate-500">
                                Click a text to select · drag to move · snaps to the center guides
                            </p>
                        </div>

                        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-none border border-neutral-200 bg-white/95 px-1.5 py-1 shadow-lg backdrop-blur md:hidden dark:border-slate-700 dark:bg-[#1e1f24]/95">
                            <button
                                type="button"
                                onClick={() => setZoom((value) => clamp(Number((value - 0.1).toFixed(2)), 0.4, 2.5))}
                                className="grid h-7 w-7 place-items-center rounded-none text-neutral-500 hover:bg-neutral-100 dark:text-slate-300 dark:hover:bg-slate-700"
                                aria-label="Zoom out"
                            >
                                <ZoomOut size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setZoom(1)}
                                className="min-w-[46px] rounded-none px-1 text-center text-[11px] font-bold text-neutral-600 hover:bg-neutral-100 dark:text-slate-200 dark:hover:bg-slate-700"
                                title="Fit to screen"
                            >
                                {Math.round(scale * 100)}%
                            </button>
                            <button
                                type="button"
                                onClick={() => setZoom((value) => clamp(Number((value + 0.1).toFixed(2)), 0.4, 2.5))}
                                className="grid h-7 w-7 place-items-center rounded-none text-neutral-500 hover:bg-neutral-100 dark:text-slate-300 dark:hover:bg-slate-700"
                                aria-label="Zoom in"
                            >
                                <ZoomIn size={14} />
                            </button>
                            <span className="mx-0.5 h-4 w-px bg-neutral-200 dark:bg-slate-700" />
                            <button
                                type="button"
                                onClick={() => setZoom(1)}
                                className="grid h-7 w-7 place-items-center rounded-none text-neutral-500 hover:bg-neutral-100 dark:text-slate-300 dark:hover:bg-slate-700"
                                aria-label="Fit to screen"
                                title="Fit to screen"
                            >
                                <Maximize2 size={13} />
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-neutral-200 bg-white lg:hidden dark:border-slate-800 dark:bg-[#1a1b20]">
                        <div className="flex border-b border-neutral-200 dark:border-slate-800">
                            {TABS.map((item) => {
                                const Icon = item.icon;
                                const active = tab === item.id;

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setTab(item.id)}
                                        className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition ${
                                            active
                                                ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400'
                                                : 'text-neutral-400 dark:text-slate-500'
                                        }`}
                                    >
                                        <Icon size={17} strokeWidth={1.8} />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="max-h-[62vh] overflow-y-auto">
                            <DesignerPanel
                                tab={tab}
                                template={template}
                                values={values}
                                selected={selected}
                                activeBackgroundUrl={activeBackgroundUrl}
                                hasBackground={hasBackground}
                                backgroundFile={backgroundFile}
                                signatureImageUrl={activeSignatureUrl}
                                signatureError={signatureError}
                                onPickSignature={pickSignature}
                                onRemoveSignature={handleRemoveSignature}
                                onSelect={setSelected}
                                onSetElement={setElement}
                                onSetField={setField}
                                onApplyPreset={applyPreset}
                                onApplyPalette={applyPalette}
                                onResetElement={resetElement}
                                onAddText={addText}
                                onDeleteElement={deleteElement}
                                onPickBackground={pickBackground}
                                onRemoveBackground={handleRemoveBackground}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {previewOpen && (
                <div className="fixed inset-0 z-[80] flex flex-col bg-neutral-950/95 backdrop-blur-sm">
                    <div className="flex h-14 shrink-0 items-center justify-between px-4 text-white">
                        <div className="flex items-center gap-2">
                            <Eye size={16} className="text-purple-400" />
                            <span className="text-sm font-semibold">Certificate preview</span>
                            <span className="hidden rounded-none bg-white/10 px-2 py-0.5 text-[10px] text-white/60 sm:inline">A4 landscape</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setPreviewOpen(false)}
                            className="grid h-9 w-9 place-items-center rounded-none text-white/70 transition hover:bg-white/10 hover:text-white"
                            aria-label="Close preview"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex flex-1 items-center justify-center overflow-auto p-4">
                        <div
                            style={{ width: CANVAS_W * previewScale, height: CANVAS_H * previewScale }}
                            className="overflow-hidden rounded-[3px] bg-white shadow-2xl"
                        >
                            <div
                                style={{
                                    transform: `scale(${previewScale})`,
                                    transformOrigin: 'top left',
                                    width: CANVAS_W,
                                    height: CANVAS_H,
                                }}
                            >
                                <DesignerCanvas
                                    template={template}
                                    values={values}
                                    backgroundUrl={activeBackgroundUrl}
                                    signatureImageUrl={activeSignatureUrl}
                                    selected={null}
                                    interactive={false}
                                    brandName={brandName}
                                    onSelect={() => undefined}
                                    onChange={() => undefined}
                                />
                            </div>
                        </div>
                    </div>

                    <p className="pb-4 text-center text-[11px] text-white/40">Press Esc to close</p>
                </div>
            )}
        </div>
    );
}

function ContextToolbar({
    element,
    elementKey,
    label,
    signatureName,
    signatureImageUrl,
    signatureError,
    onSetElement,
    onSetSignatureName,
    onPickSignature,
    onRemoveSignature,
    onReset,
    onDelete,
}: {
    element: ElementConfig;
    elementKey: ElementKey;
    label: string;
    signatureName: string;
    signatureImageUrl: string | null;
    signatureError: string | null;
    onSetElement: (patch: Partial<ElementConfig>) => void;
    onSetSignatureName: (value: string) => void;
    onPickSignature: (file: File | null) => void;
    onRemoveSignature: () => void;
    onReset: () => void;
    onDelete: () => void;
}) {
    const isSignature = elementKey === 'signature_name';
    const hasText = isSignature || isTextEditableKey(elementKey);
    const custom = isCustomElementKey(elementKey);
    const textValue = isSignature ? signatureName : (element.text ?? '');

    const setPosition = (axis: 'x' | 'y', raw: string) => {
        const value = Number(raw);
        if (!Number.isFinite(value)) return;
        onSetElement({ [axis]: Math.round(Math.max(0, Math.min(100, value)) * 10) / 10 });
    };

    return (
        <div className="w-full overflow-hidden rounded-none border border-neutral-200 bg-white/95 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-[#24252b]/95">
            <div className="flex w-full items-center gap-0.5 overflow-x-auto px-1.5 py-1">
                <span className="flex shrink-0 items-center gap-1.5 px-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-none bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300">
                        <Type size={11} />
                    </span>
                    <span className="max-w-[130px] truncate text-[11px] font-semibold text-neutral-700 dark:text-slate-200">{label}</span>
                </span>

                <Divider />

                {(
                    [
                        { value: 'left', icon: AlignLeft },
                        { value: 'center', icon: AlignCenter },
                        { value: 'right', icon: AlignRight },
                    ] as const
                ).map((option) => {
                    const Icon = option.icon;
                    const active = element.align === option.value;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onSetElement({ align: option.value })}
                            className={`grid h-7 w-7 shrink-0 place-items-center rounded-none transition ${
                                active
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300'
                                    : 'text-neutral-500 hover:bg-neutral-100 dark:text-slate-400 dark:hover:bg-slate-700'
                            }`}
                            aria-label={`Align ${option.value}`}
                        >
                            <Icon size={14} />
                        </button>
                    );
                })}

                <Divider />

                <button
                    type="button"
                    onClick={() => onSetElement({ fontSize: Math.max(6, element.fontSize - 1) })}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-none text-neutral-500 hover:bg-neutral-100 dark:text-slate-400 dark:hover:bg-slate-700"
                    aria-label="Decrease font size"
                >
                    <Minus size={13} />
                </button>
                <span className="min-w-[26px] shrink-0 text-center text-[11px] font-bold text-neutral-700 dark:text-slate-200">
                    {Math.round(element.fontSize)}
                </span>
                <button
                    type="button"
                    onClick={() => onSetElement({ fontSize: Math.min(120, element.fontSize + 1) })}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-none text-neutral-500 hover:bg-neutral-100 dark:text-slate-400 dark:hover:bg-slate-700"
                    aria-label="Increase font size"
                >
                    <Plus size={13} />
                </button>

                <Divider />

                <label className="relative grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-none" title="Text color">
                    <span
                        className="h-5 w-5 rounded-full border border-white ring-1 ring-neutral-300 dark:ring-slate-600"
                        style={{ background: element.color }}
                    />
                    <input
                        type="color"
                        value={element.color}
                        onChange={(event) => onSetElement({ color: event.target.value })}
                        className="absolute inset-0 cursor-pointer opacity-0"
                    />
                </label>

                <Divider />

                <button
                    type="button"
                    onClick={() => onSetElement({ visible: !element.visible })}
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-none transition ${
                        element.visible
                            ? 'text-neutral-500 hover:bg-neutral-100 dark:text-slate-400 dark:hover:bg-slate-700'
                            : 'text-neutral-300 dark:text-slate-600'
                    }`}
                    aria-label={element.visible ? 'Hide element' : 'Show element'}
                >
                    {element.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-t border-neutral-200/80 px-2 py-1.5 dark:border-slate-700/80">
                {hasText ? (
                    <input
                        type="text"
                        value={textValue}
                        maxLength={200}
                        placeholder={isSignature ? 'Signature name' : 'Type your text'}
                        onChange={(event) => {
                            if (isSignature) onSetSignatureName(event.target.value);
                            else onSetElement({ text: event.target.value });
                        }}
                        className="min-w-[160px] flex-1 rounded-none border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-800 outline-none focus:border-purple-400 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-100"
                    />
                ) : (
                    <span className="min-w-[160px] flex-1 truncate rounded-none bg-neutral-50 px-2 py-1 text-[10px] text-neutral-400 dark:bg-slate-800/60 dark:text-slate-500">
                        Dynamic content
                    </span>
                )}

                {isSignature && (
                    <>
                        <label
                            className="flex shrink-0 cursor-pointer items-center gap-1 rounded-none border border-purple-200 bg-purple-50 px-1.5 py-1 text-[10px] font-semibold text-purple-700 transition hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300"
                            title="Upload a transparent PNG signature"
                        >
                            <ImagePlus size={11} /> PNG
                            <input
                                type="file"
                                accept="image/png"
                                className="hidden"
                                onChange={(event) => {
                                    onPickSignature(event.target.files?.[0] ?? null);
                                    event.target.value = '';
                                }}
                            />
                        </label>
                        {signatureImageUrl && (
                            <button
                                type="button"
                                onClick={onRemoveSignature}
                                className="grid h-6 w-6 shrink-0 place-items-center rounded-none text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Remove signature image"
                                aria-label="Remove signature image"
                            >
                                <Trash2 size={11} />
                            </button>
                        )}
                    </>
                )}

                <label className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-neutral-500 dark:text-slate-400">
                    X
                    <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={element.x}
                        onChange={(event) => setPosition('x', event.target.value)}
                        className="w-14 rounded-none border border-neutral-200 bg-white px-1 py-1 text-center text-[11px] font-bold text-neutral-700 outline-none dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-200"
                    />
                    %
                </label>
                <label className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-neutral-500 dark:text-slate-400">
                    Y
                    <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={element.y}
                        onChange={(event) => setPosition('y', event.target.value)}
                        className="w-14 rounded-none border border-neutral-200 bg-white px-1 py-1 text-center text-[11px] font-bold text-neutral-700 outline-none dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-200"
                    />
                    %
                </label>

                <button
                    type="button"
                    onClick={onReset}
                    className="flex shrink-0 items-center gap-1 rounded-none px-1.5 py-1 text-[10px] font-semibold text-neutral-500 transition hover:bg-neutral-100 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                    <RotateCcw size={11} /> Reset
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    className="flex shrink-0 items-center gap-1 rounded-none px-1.5 py-1 text-[10px] font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                >
                    <Trash2 size={11} /> {custom ? 'Delete' : 'Remove'}
                </button>
            </div>

            {isSignature && signatureError && (
                <p className="border-t border-rose-100 bg-rose-50/80 px-2.5 py-1 text-[10px] text-rose-600 dark:border-rose-950/50 dark:bg-rose-950/30 dark:text-rose-300">
                    {signatureError}
                </p>
            )}
        </div>
    );
}

function IconButton({ children, label, onClick, disabled }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={label}
            aria-label={label}
            className="grid h-8 w-8 place-items-center rounded-none text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 disabled:cursor-not-allowed disabled:opacity-35 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
            {children}
        </button>
    );
}

function Divider() {
    return <span className="mx-0.5 h-4 w-px shrink-0 bg-neutral-200 dark:bg-slate-700" />;
}
