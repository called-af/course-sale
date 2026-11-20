import { router } from '@inertiajs/react';
import { Check, LoaderCircle, Palette } from 'lucide-react';
import { useState } from 'react';

const palettes = [
    { id: 'purple', label: 'Purple', light: '#6b21a8', dark: '#9333ea' },
    { id: 'indigo', label: 'Indigo', light: '#3730a3', dark: '#4f46e5' },
    { id: 'blue', label: 'Blue', light: '#1d4ed8', dark: '#2563eb' },
    { id: 'teal', label: 'Teal', light: '#115e59', dark: '#0d9488' },
    { id: 'emerald', label: 'Emerald', light: '#047857', dark: '#059669' },
    { id: 'cyan', label: 'Cyan', light: '#0e7490', dark: '#0891b2' },
    { id: 'rose', label: 'Rose', light: '#9f1239', dark: '#e11d48' },
    { id: 'pink', label: 'Pink', light: '#be185d', dark: '#db2777' },
    { id: 'orange', label: 'Orange', light: '#c2410c', dark: '#ea580c' },
    { id: 'amber', label: 'Amber', light: '#b45309', dark: '#d97706' },
] as const;

type PaletteId = (typeof palettes)[number]['id'];

interface AppearanceSettingsPanelProps {
    initialPalette: PaletteId;
}

export default function AppearanceSettingsPanel({ initialPalette }: AppearanceSettingsPanelProps) {
    const [selectedPalette, setSelectedPalette] = useState<PaletteId>(initialPalette);
    const [saving, setSaving] = useState(false);

    const selectPalette = (palette: PaletteId) => {
        if (saving || palette === selectedPalette) return;

        setSelectedPalette(palette);
        setSaving(true);
        document.documentElement.dataset.palette = palette;

        router.put(
            '/admin/settings/appearance',
            { palette },
            {
                preserveScroll: true,
                onError: () => {
                    setSelectedPalette(initialPalette);
                    document.documentElement.dataset.palette = initialPalette;
                },
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <section className="space-y-5" aria-labelledby="appearance-heading">
            <div>
                <h2 id="appearance-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
                    Color palette
                </h2>
                <p className="mt-1 text-sm text-neutral-500">This choice changes the accent color for all users.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {palettes.map((palette) => {
                    const selected = selectedPalette === palette.id;

                    return (
                        <button
                            key={palette.id}
                            type="button"
                            onClick={() => selectPalette(palette.id)}
                            disabled={saving}
                            aria-pressed={selected}
                            className={`flex min-h-24 items-center gap-3 border p-4 text-left transition-colors disabled:cursor-wait disabled:opacity-70 ${
                                selected
                                    ? 'border-purple-700 bg-purple-50 dark:border-purple-500 dark:bg-purple-950/40'
                                    : 'border-slate-200 bg-white hover:border-purple-300 dark:border-slate-700 dark:bg-[#1e1f24] dark:hover:border-purple-700'
                            }`}
                        >
                            <span
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white shadow-sm dark:border-slate-700"
                                style={{ backgroundColor: palette.light }}
                            >
                                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: palette.dark }} />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block font-medium text-slate-900 dark:text-white">{palette.label}</span>
                                <span className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: palette.light }} />
                                    Light
                                    <span className="ml-1 h-2 w-2 rounded-full" style={{ backgroundColor: palette.dark }} />
                                    Dark
                                </span>
                            </span>
                            {saving && selected ? (
                                <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-purple-700 dark:text-purple-400" />
                            ) : selected ? (
                                <Check className="h-4 w-4 shrink-0 text-purple-800 dark:text-purple-400" />
                            ) : null}
                        </button>
                    );
                })}
            </div>

            <div className="flex items-start gap-3 border-t border-neutral-200 pt-4 text-sm text-neutral-500 dark:border-slate-700">
                <Palette className="mt-0.5 h-4 w-4 shrink-0 text-purple-800 dark:text-purple-400" />
                <p>Light background uses soft gray. Dark mode uses purple-toned charcoal with brighter accents.</p>
            </div>
        </section>
    );
}
