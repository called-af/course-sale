import { Download, ExternalLink, Presentation } from 'lucide-react';
import React, { useMemo, useRef } from 'react';

interface PreviewPptViewerProps {
    title: string;
    contentUrl?: string | null;
    previewUrl?: string | null;
    onOpen?: () => void;
}

interface PresentationEmbed {
    src: string;
    source: string;
}

function absoluteUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) {
        return url;
    }

    if (typeof window === 'undefined') {
        return url;
    }

    return new URL(url, window.location.origin).toString();
}

/**
 * Resolve a presentation URL into an embeddable player so the deck is shown
 * directly inside the lesson instead of sending the student to another site.
 */
function resolvePresentation(url?: string | null, previewUrl?: string | null): PresentationEmbed | null {
    if (previewUrl) {
        return { src: previewUrl, source: '' };
    }

    if (!url) {
        return null;
    }

    const raw = url.trim();

    if (raw === '') {
        return null;
    }

    // Google Slides — turn edit/view links into the embed player.
    const googleSlides = raw.match(/docs\.google\.com\/presentation\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/);
    if (googleSlides) {
        return {
            src: `https://docs.google.com/presentation/d/${googleSlides[1]}/embed?start=false&loop=false&delayms=3000`,
            source: 'Google Slides',
        };
    }

    if (/docs\.google\.com\/presentation\/pub/i.test(raw)) {
        return { src: raw, source: 'Google Slides' };
    }

    // Canva decks.
    const canva = raw.match(/canva\.com\/design\/([a-zA-Z0-9_-]+)/);
    if (canva) {
        return { src: `https://www.canva.com/design/${canva[1]}/view?embed`, source: 'Canva' };
    }

    // Figma presentations / prototypes.
    if (/figma\.com\/(?:file|design|proto)\//i.test(raw)) {
        return { src: `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(raw)}`, source: 'Figma' };
    }

    // PowerPoint / Word / Excel files and OneDrive/SharePoint links — use the
    // Office web viewer so the slides render inside the page.
    if (/\.(pptx?|docx?|xlsx?)(\?|#|$)/i.test(raw) || /(1drv\.ms|onedrive\.live\.com|sharepoint\.com|officeapps\.live\.com)/i.test(raw)) {
        return { src: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteUrl(raw))}`, source: 'Office' };
    }

    // PDF decks render natively in the browser.
    if (/\.pdf(\?|#|$)/i.test(raw)) {
        return { src: raw, source: 'PDF' };
    }

    // Only use SlideShare when the URL already points at an embed player.
    if (/slideshare\.net/i.test(raw)) {
        return /slideshare\.net\/slideshow\/embed_code\//i.test(raw) ? { src: raw, source: 'SlideShare' } : null;
    }

    // Same-origin files or any other public presentation page.
    if (raw.startsWith('/') || /^https?:\/\//i.test(raw)) {
        return { src: raw, source: 'Web' };
    }

    return null;
}

export default function PreviewPptViewer({ title, contentUrl, previewUrl, onOpen }: PreviewPptViewerProps) {
    const embed = useMemo(() => resolvePresentation(contentUrl, previewUrl), [contentUrl, previewUrl]);
    const markedOpenRef = useRef(false);
    const canDownload = /\.(pdf|pptx?|docx?|xlsx?|key)(\?|#|$)/i.test(contentUrl ?? '');

    const handleLoad = () => {
        if (markedOpenRef.current) {
            return;
        }

        markedOpenRef.current = true;
        onOpen?.();
    };

    return (
        <div className="space-y-3 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-700">
                <div className="flex min-w-0 items-center gap-2">
                    <Presentation className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="truncate text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-200">
                        {title || 'Presentation Deck'}
                    </span>
                    {embed && embed.source && (
                        <span className="shrink-0 border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:border-slate-600 dark:text-slate-400">
                            {embed.source}
                        </span>
                    )}
                </div>

                {embed && (
                    <div className="flex shrink-0 items-center gap-3 text-[11px] font-medium">
                        <a
                            href={contentUrl ?? '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-purple-600 hover:underline dark:text-purple-400"
                        >
                            <ExternalLink className="h-3 w-3" /> Open in new tab
                        </a>
                        {canDownload && (
                            <a
                                href={contentUrl ?? '#'}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="inline-flex items-center gap-1 text-emerald-600 hover:underline dark:text-emerald-400"
                            >
                                <Download className="h-3 w-3" /> Download
                            </a>
                        )}
                    </div>
                )}
            </div>

            {embed ? (
                <div className="relative aspect-video w-full overflow-hidden border border-slate-200 bg-slate-900 dark:border-slate-700">
                    <iframe
                        src={embed.src}
                        title={title || 'Presentation deck'}
                        className="absolute inset-0 h-full w-full"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                        onLoad={handleLoad}
                    />
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center dark:border-slate-700 dark:bg-[#1e1f24]">
                    <div className="flex h-14 w-14 items-center justify-center bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300">
                        <Presentation className="h-7 w-7" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
                        <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                            {contentUrl
                                ? 'This slide deck cannot be embedded. Use a Google Slides, Canva, Figma, PDF, or PowerPoint link so the slides play directly on this page.'
                                : 'No presentation link has been added for this lesson yet.'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
