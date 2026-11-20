import { Head, useForm, usePage } from '@inertiajs/react';
import { BarChart3, Check, ImagePlus, LoaderCircle, Save, Search, Share2, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';

import Button from '@/components/atoms/Button';
import Title from '@/components/atoms/Title';
import AdminLayout from '@/components/templates/AdminLayout';

interface SeoServerData {
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
    canonical_url: string | null;
    robots: string;
    og_title: string | null;
    og_description: string | null;
    og_image: string | null;
    og_image_url: string | null;
    og_type: string;
    twitter_card: string;
    twitter_site: string | null;
    google_site_verification: string | null;
    bing_site_verification: string | null;
    google_analytics_id: string | null;
    google_tag_manager_id: string | null;
}

interface SeoFormData {
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    canonical_url: string;
    robots: string;
    og_title: string;
    og_description: string;
    og_image: string;
    og_type: string;
    twitter_card: string;
    twitter_site: string;
    google_site_verification: string;
    bing_site_verification: string;
    google_analytics_id: string;
    google_tag_manager_id: string;
    og_image_file: File | null;
    remove_og_image: boolean;
}

interface SeoPageProps {
    seo: SeoServerData;
    robotsOptions: string[];
    ogTypes: string[];
    twitterCards: string[];
    [key: string]: unknown;
}

type TabKey = 'basic' | 'social' | 'analytics';

const TABS: { key: TabKey; label: string; icon: typeof Search }[] = [
    { key: 'basic', label: 'Basic Meta', icon: Search },
    { key: 'social', label: 'Open Graph & Twitter', icon: Share2 },
    { key: 'analytics', label: 'Verification & Analytics', icon: BarChart3 },
];

const BASIC_FIELDS = ['meta_title', 'meta_description', 'meta_keywords', 'canonical_url', 'robots'];
const SOCIAL_FIELDS = ['og_title', 'og_description', 'og_image', 'og_image_file', 'og_type', 'twitter_card', 'twitter_site'];
const ANALYTICS_FIELDS = ['google_site_verification', 'bing_site_verification', 'google_analytics_id', 'google_tag_manager_id'];

function toForm(seo: SeoServerData): SeoFormData {
    return {
        meta_title: seo.meta_title ?? '',
        meta_description: seo.meta_description ?? '',
        meta_keywords: seo.meta_keywords ?? '',
        canonical_url: seo.canonical_url ?? '',
        robots: seo.robots || 'index,follow',
        og_title: seo.og_title ?? '',
        og_description: seo.og_description ?? '',
        og_image: seo.og_image ?? '',
        og_type: seo.og_type || 'website',
        twitter_card: seo.twitter_card || 'summary_large_image',
        twitter_site: seo.twitter_site ?? '',
        google_site_verification: seo.google_site_verification ?? '',
        bing_site_verification: seo.bing_site_verification ?? '',
        google_analytics_id: seo.google_analytics_id ?? '',
        google_tag_manager_id: seo.google_tag_manager_id ?? '',
        og_image_file: null,
        remove_og_image: false,
    };
}

function mediaUrl(value: string): string {
    if (/^https?:\/\//i.test(value) || value.startsWith('/')) {
        return value;
    }

    return `/storage/${value.replace(/^storage\//, '')}`;
}

const inputClass =
    'w-full border border-neutral-300 bg-white px-3 py-2 text-sm text-slate-900 transition outline-none placeholder:text-slate-400 focus:border-purple-700 focus:ring-1 focus:ring-purple-700 dark:border-slate-600 dark:bg-[#1e1f24] dark:text-white dark:placeholder:text-slate-500';

const labelClass = 'text-xs font-semibold tracking-wide text-slate-600 uppercase dark:text-slate-400';
const hintClass = 'text-xs text-slate-500 dark:text-slate-400';

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
    return (
        <section className="border border-neutral-200 bg-white dark:border-slate-700 dark:bg-[#1e1f24]">
            <header className="border-b border-neutral-200 px-5 py-3.5 dark:border-slate-700">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
                {hint && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
            </header>
            <div className="space-y-5 p-5">{children}</div>
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

export default function Seo() {
    const { props } = usePage<SeoPageProps>();
    const { seo, robotsOptions, ogTypes, twitterCards } = props;

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm<SeoFormData>(toForm(seo));
    const inputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [tab, setTab] = useState<TabKey>('basic');

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    // If validation fails, open the tab containing the problematic field.
    useEffect(() => {
        const keys = Object.keys(errors);

        if (keys.length === 0) {
            return;
        }

        if (keys.some((key) => BASIC_FIELDS.includes(key))) {
            setTab('basic');
        } else if (keys.some((key) => SOCIAL_FIELDS.includes(key))) {
            setTab('social');
        } else if (keys.some((key) => ANALYTICS_FIELDS.includes(key))) {
            setTab('analytics');
        }
    }, [errors]);

    const previewImage = previewUrl ?? (data.remove_og_image ? null : data.og_image ? mediaUrl(data.og_image) : null);
    const titlePreview = data.meta_title || 'Page title shown in Google search results';
    const descriptionPreview = data.meta_description || 'A short page description shown below the title in Google search results.';
    const canonicalPreview = data.canonical_url || window.location.origin;

    const chooseFile = (file?: File) => {
        if (!file) return;

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setPreviewUrl(URL.createObjectURL(file));
        setData('og_image_file', file);
        setData('remove_og_image', false);

        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const removeImage = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }

        setData('og_image_file', null);
        setData('og_image', '');
        setData('remove_og_image', true);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        post(route('admin.settings.seo.update'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: (page) => {
                const fresh = (page.props as unknown as SeoPageProps).seo;

                setData(toForm(fresh));
                setPreviewUrl(null);
            },
        });
    };

    return (
        <>
            <Head title="SEO Settings" />

            <form onSubmit={submit} className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <Title as="h3">SEO Settings</Title>
                        <p className="mt-1 max-w-2xl text-sm text-neutral-500">
                            Configure titles, descriptions, social sharing images, search engine verification, and analytics. All values are stored in
                            the database and applied directly to the site’s meta tags.
                        </p>
                    </div>

                    <Button
                        type="submit"
                        leftIcon={processing ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                        disabled={processing}
                        className="w-full sm:w-auto"
                    >
                        Save SEO
                    </Button>
                </div>

                {recentlySuccessful && (
                    <div className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <Check size={14} />
                        SEO settings saved.
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="min-w-0 space-y-4">
                        <nav
                            aria-label="SEO settings sections"
                            className="flex flex-wrap gap-1 border border-neutral-200 bg-white p-1.5 dark:border-slate-700 dark:bg-[#1e1f24]"
                        >
                            {TABS.map(({ key, label, icon: Icon }) => {
                                const active = tab === key;

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        role="tab"
                                        aria-selected={active}
                                        onClick={() => setTab(key)}
                                        className={`inline-flex flex-1 items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                                            active
                                                ? 'bg-purple-700 text-white'
                                                : 'text-slate-600 hover:bg-neutral-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                                        }`}
                                    >
                                        <Icon size={15} />
                                        <span className="truncate">{label}</span>
                                    </button>
                                );
                            })}
                        </nav>

                        {tab === 'basic' && (
                            <Panel title="Basic Meta" hint="Used for title, description, keywords, canonical, and robots tags.">
                                <Field label="Meta title" hint={`${data.meta_title.length}/60 characters. Ideal length is 50–60 characters.`}>
                                    <input
                                        className={inputClass}
                                        value={data.meta_title}
                                        onChange={(event) => setData('meta_title', event.target.value)}
                                        placeholder={seo.meta_title ? undefined : 'Example: KursusIO — Online Course Platform'}
                                        maxLength={255}
                                    />
                                    {errors.meta_title && <span className="block text-xs text-red-600 dark:text-red-400">{errors.meta_title}</span>}
                                </Field>

                                <Field
                                    label="Meta description"
                                    hint={`${data.meta_description.length}/160 characters. Ideal length is 150–160 characters.`}
                                >
                                    <textarea
                                        className={`${inputClass} min-h-24 resize-y`}
                                        value={data.meta_description}
                                        onChange={(event) => setData('meta_description', event.target.value)}
                                        placeholder="Briefly describe the site’s content and value."
                                        maxLength={500}
                                    />
                                    {errors.meta_description && (
                                        <span className="block text-xs text-red-600 dark:text-red-400">{errors.meta_description}</span>
                                    )}
                                </Field>

                                <div className="grid gap-5 md:grid-cols-2">
                                    <Field label="Meta keywords" hint="Separate with commas. Has minimal impact on modern SEO.">
                                        <input
                                            className={inputClass}
                                            value={data.meta_keywords}
                                            onChange={(event) => setData('meta_keywords', event.target.value)}
                                            placeholder="online courses, digital learning, online classes"
                                            maxLength={255}
                                        />
                                        {errors.meta_keywords && (
                                            <span className="block text-xs text-red-600 dark:text-red-400">{errors.meta_keywords}</span>
                                        )}
                                    </Field>

                                    <Field label="Canonical URL" hint="Leave empty to use the current page URL.">
                                        <input
                                            className={inputClass}
                                            value={data.canonical_url}
                                            onChange={(event) => setData('canonical_url', event.target.value)}
                                            placeholder="https://domain.com/"
                                        />
                                        {errors.canonical_url && (
                                            <span className="block text-xs text-red-600 dark:text-red-400">{errors.canonical_url}</span>
                                        )}
                                    </Field>
                                </div>

                                <Field label="Robots" hint="Use noindex if the site is still under development.">
                                    <select className={inputClass} value={data.robots} onChange={(event) => setData('robots', event.target.value)}>
                                        {robotsOptions.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.robots && <span className="block text-xs text-red-600 dark:text-red-400">{errors.robots}</span>}
                                </Field>
                            </Panel>
                        )}

                        {tab === 'social' && (
                            <Panel title="Open Graph & Twitter Card" hint="How links appear when shared on social media and WhatsApp.">
                                <div className="grid gap-5 md:grid-cols-2">
                                    <Field label="OG title" hint="Leave empty to use the meta title.">
                                        <input
                                            className={inputClass}
                                            value={data.og_title}
                                            onChange={(event) => setData('og_title', event.target.value)}
                                            maxLength={255}
                                        />
                                        {errors.og_title && <span className="block text-xs text-red-600 dark:text-red-400">{errors.og_title}</span>}
                                    </Field>

                                    <Field label="OG type">
                                        <select
                                            className={inputClass}
                                            value={data.og_type}
                                            onChange={(event) => setData('og_type', event.target.value)}
                                        >
                                            {ogTypes.map((type) => (
                                                <option key={type} value={type}>
                                                    {type}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.og_type && <span className="block text-xs text-red-600 dark:text-red-400">{errors.og_type}</span>}
                                    </Field>
                                </div>

                                <Field label="OG description" hint="Leave empty to use the meta description.">
                                    <textarea
                                        className={`${inputClass} min-h-20 resize-y`}
                                        value={data.og_description}
                                        onChange={(event) => setData('og_description', event.target.value)}
                                        maxLength={500}
                                    />
                                    {errors.og_description && (
                                        <span className="block text-xs text-red-600 dark:text-red-400">{errors.og_description}</span>
                                    )}
                                </Field>

                                <div className="grid gap-5 md:grid-cols-2">
                                    <Field label="Twitter card">
                                        <select
                                            className={inputClass}
                                            value={data.twitter_card}
                                            onChange={(event) => setData('twitter_card', event.target.value)}
                                        >
                                            {twitterCards.map((card) => (
                                                <option key={card} value={card}>
                                                    {card}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.twitter_card && (
                                            <span className="block text-xs text-red-600 dark:text-red-400">{errors.twitter_card}</span>
                                        )}
                                    </Field>

                                    <Field label="Twitter / X handle" hint="Example: @kursusio">
                                        <input
                                            className={inputClass}
                                            value={data.twitter_site}
                                            onChange={(event) => setData('twitter_site', event.target.value)}
                                            placeholder="@username"
                                            maxLength={100}
                                        />
                                        {errors.twitter_site && (
                                            <span className="block text-xs text-red-600 dark:text-red-400">{errors.twitter_site}</span>
                                        )}
                                    </Field>
                                </div>

                                <div className="space-y-2">
                                    <span className={labelClass}>OG image</span>
                                    <p className={hintClass}>
                                        Recommended ratio 1200×630 px, maximum 4 MB. You can upload a file or enter an image URL.
                                    </p>

                                    <div className="flex flex-col gap-4 border border-dashed border-neutral-300 p-4 sm:flex-row sm:items-center dark:border-slate-600">
                                        <div className="flex h-24 w-full items-center justify-center overflow-hidden bg-neutral-100 sm:w-44 dark:bg-[#141416]">
                                            {previewImage ? (
                                                <img src={previewImage} alt="OG image preview" className="h-full w-full object-cover" />
                                            ) : (
                                                <ImagePlus size={28} className="text-neutral-400" />
                                            )}
                                        </div>

                                        <div className="flex flex-1 flex-col gap-3">
                                            <input
                                                className={inputClass}
                                                value={data.og_image}
                                                onChange={(event) => {
                                                    setData('og_image', event.target.value);
                                                    setData('remove_og_image', false);
                                                }}
                                                placeholder="https://domain.com/image.jpg or leave empty"
                                            />

                                            <div className="flex flex-wrap gap-2">
                                                <input
                                                    ref={inputRef}
                                                    type="file"
                                                    accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                                                    className="sr-only"
                                                    onChange={(event) => chooseFile(event.target.files?.[0])}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    leftIcon={<ImagePlus size={16} />}
                                                    onClick={() => inputRef.current?.click()}
                                                    disabled={processing}
                                                >
                                                    Choose image
                                                </Button>

                                                {previewImage && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        leftIcon={<Trash2 size={16} />}
                                                        onClick={removeImage}
                                                        disabled={processing}
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>

                                            {data.og_image_file && <p className="text-xs text-slate-500">Selected file: {data.og_image_file.name}</p>}
                                            {errors.og_image_file && <p className="text-xs text-red-600 dark:text-red-400">{errors.og_image_file}</p>}
                                        </div>
                                    </div>
                                </div>
                            </Panel>
                        )}

                        {tab === 'analytics' && (
                            <Panel title="Verification & Analytics" hint="Paste verification codes from Google Search Console / Bing Webmaster.">
                                <div className="grid gap-5 md:grid-cols-2">
                                    <Field label="Google site verification">
                                        <input
                                            className={inputClass}
                                            value={data.google_site_verification}
                                            onChange={(event) => setData('google_site_verification', event.target.value)}
                                            placeholder="Google verification code"
                                            maxLength={120}
                                        />
                                        {errors.google_site_verification && (
                                            <span className="block text-xs text-red-600 dark:text-red-400">{errors.google_site_verification}</span>
                                        )}
                                    </Field>

                                    <Field label="Bing site verification">
                                        <input
                                            className={inputClass}
                                            value={data.bing_site_verification}
                                            onChange={(event) => setData('bing_site_verification', event.target.value)}
                                            placeholder="Bing verification code"
                                            maxLength={120}
                                        />
                                        {errors.bing_site_verification && (
                                            <span className="block text-xs text-red-600 dark:text-red-400">{errors.bing_site_verification}</span>
                                        )}
                                    </Field>

                                    <Field label="Google Analytics ID" hint="Format: G-XXXXXXX, UA-XXXXX, or AW-XXXXX.">
                                        <input
                                            className={inputClass}
                                            value={data.google_analytics_id}
                                            onChange={(event) => setData('google_analytics_id', event.target.value)}
                                            placeholder="G-XXXXXXXXXX"
                                            maxLength={50}
                                        />
                                        {errors.google_analytics_id && (
                                            <span className="block text-xs text-red-600 dark:text-red-400">{errors.google_analytics_id}</span>
                                        )}
                                    </Field>

                                    <Field label="Google Tag Manager ID" hint="Format: GTM-XXXXXXX.">
                                        <input
                                            className={inputClass}
                                            value={data.google_tag_manager_id}
                                            onChange={(event) => setData('google_tag_manager_id', event.target.value)}
                                            placeholder="GTM-XXXXXXX"
                                            maxLength={30}
                                        />
                                        {errors.google_tag_manager_id && (
                                            <span className="block text-xs text-red-600 dark:text-red-400">{errors.google_tag_manager_id}</span>
                                        )}
                                    </Field>
                                </div>
                            </Panel>
                        )}

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                leftIcon={processing ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                                disabled={processing}
                            >
                                Save SEO
                            </Button>
                        </div>
                    </div>

                    <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
                        <Panel title="Google Preview">
                            <div className="space-y-1">
                                <p className="line-clamp-1 text-xs text-emerald-700 dark:text-emerald-400">{canonicalPreview}</p>
                                <p className="line-clamp-2 text-lg leading-snug font-medium text-[#1a0dab] dark:text-blue-400">{titlePreview}</p>
                                <p className="line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{descriptionPreview}</p>
                            </div>
                        </Panel>

                        <Panel title="Social Sharing Preview" hint="Approximate appearance when a link is shared.">
                            <div className="overflow-hidden border border-neutral-200 dark:border-slate-700">
                                <div className="flex aspect-[1.91/1] items-center justify-center bg-neutral-100 dark:bg-[#141416]">
                                    {previewImage ? (
                                        <img src={previewImage} alt="Social sharing image preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <ImagePlus size={26} className="text-neutral-400" />
                                    )}
                                </div>
                                <div className="space-y-1 bg-white p-3 dark:bg-[#1e1f24]">
                                    <p className="text-[11px] text-slate-400 uppercase">
                                        {canonicalPreview.replace(/^https?:\/\//, '').split('/')[0]}
                                    </p>
                                    <p className="line-clamp-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        {data.og_title || titlePreview}
                                    </p>
                                    <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                                        {data.og_description || descriptionPreview}
                                    </p>
                                </div>
                            </div>
                        </Panel>

                        <div className="border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                            <p className="font-semibold">Quick tips</p>
                            <ul className="mt-2 list-disc space-y-1 pl-4">
                                <li>Unique and clear titles are more likely to be clicked.</li>
                                <li>Use one page for one primary topic.</li>
                                <li>Make sure the OG image remains readable at small sizes.</li>
                            </ul>
                        </div>
                    </aside>
                </div>
            </form>
        </>
    );
}

Seo.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
