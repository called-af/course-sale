import { router, useForm } from '@inertiajs/react';
import { ImagePlus, LoaderCircle, RotateCcw, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';

import Button from '@/components/atoms/Button';

interface LogoSettingsPanelProps {
    initialLogoUrl: string;
    hasCustomLogo: boolean;
}

export default function LogoSettingsPanel({ initialLogoUrl, hasCustomLogo }: LogoSettingsPanelProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const { data, setData, post, processing, errors, reset, progress } = useForm<{
        logo: File | null;
    }>({
        logo: null,
    });

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const chooseFile = (file?: File) => {
        if (!file) return;

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setPreviewUrl(URL.createObjectURL(file));
        setData('logo', file);

        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        post(route('admin.settings.logo.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setPreviewUrl(null);
            },
        });
    };

    const restoreDefault = () => {
        if (!window.confirm('Kembalikan logo aplikasi ke logo default?')) {
            return;
        }

        router.delete(route('admin.settings.logo.destroy'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setPreviewUrl(null);
            },
        });
    };

    const currentLogo = previewUrl ?? initialLogoUrl;

    return (
        <section className="space-y-5" aria-labelledby="logo-heading">
            <div>
                <h2 id="logo-heading" className="text-lg font-semibold text-slate-900 dark:text-white">
                    Logo aplikasi
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                    Ganti logo yang tampil di landing page, dashboard, dan sidebar. Format PNG, JPG, WEBP, atau SVG maksimal 2 MB.
                </p>
            </div>

            <form
                onSubmit={submit}
                className="relative grid gap-5 border border-neutral-200 bg-white p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] dark:border-slate-700 dark:bg-[#1e1f24]"
            >
                <div className="flex min-h-32 items-center justify-center border border-dashed border-neutral-300 bg-neutral-50 p-6 dark:border-slate-600 dark:bg-[#1e1f24]">
                    <img src={currentLogo} alt="Pratinjau logo aplikasi" className="max-h-20 w-auto max-w-full object-contain" />
                </div>

                <div className="flex flex-col justify-center gap-4">
                    <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{data.logo ? data.logo.name : 'Unggah logo baru'}</p>
                        <p className="mt-1 text-xs text-neutral-500">
                            {hasCustomLogo ? 'Logo kustom sedang digunakan.' : 'Saat ini memakai logo default.'}
                        </p>
                    </div>

                    <input
                        ref={inputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
                        className="sr-only"
                        onChange={(event) => chooseFile(event.target.files?.[0])}
                    />

                    {errors.logo && <p className="text-xs text-red-600 dark:text-red-400">{errors.logo}</p>}

                    {progress && (
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-slate-700">
                            <div
                                className="h-full bg-purple-700 transition-all dark:bg-purple-500"
                                style={{ width: `${progress.percentage ?? 0}%` }}
                            />
                        </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            leftIcon={<ImagePlus size={16} />}
                            onClick={() => inputRef.current?.click()}
                            disabled={processing}
                        >
                            Pilih file
                        </Button>

                        <Button
                            type="submit"
                            leftIcon={processing ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}
                            disabled={!data.logo || processing}
                        >
                            Simpan logo
                        </Button>

                        {(hasCustomLogo || previewUrl) && (
                            <Button type="button" variant="ghost" leftIcon={<RotateCcw size={16} />} onClick={restoreDefault} disabled={processing}>
                                Logo default
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </section>
    );
}
