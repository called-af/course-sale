import { Download, ExternalLink, File, Image as ImageIcon } from 'lucide-react';
import React, { useMemo, useRef } from 'react';

interface PreviewFileViewerProps {
    title: string;
    contentUrl?: string | null;
    previewUrl?: string | null;
    onOpen?: () => void;
}

type FileKind = 'pdf' | 'office' | 'image' | 'text' | 'web';

interface ResolvedFile {
    kind: FileKind;
    embedUrl: string | null;
    downloadUrl: string;
    source: string;
}

const OFFICE_EXTENSIONS = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'odp', 'ods'];
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'];
const TEXT_EXTENSIONS = ['txt', 'csv', 'md', 'json', 'log'];

function absoluteUrl(url: string): string {
    if (/^https?:\/\//i.test(url)) {
        return url;
    }

    if (typeof window === 'undefined') {
        return url;
    }

    return new URL(url, window.location.origin).toString();
}

function extensionOf(url: string): string {
    const clean = url.split('?')[0].split('#')[0].toLowerCase();
    const last = clean.split('/').filter(Boolean).pop() ?? '';

    return last.includes('.') ? last.split('.').pop()! : '';
}

/**
 * Resolve a file URL into an embeddable viewer + a download link. PDFs are
 * rendered natively, Office documents use the Office web viewer, and common
 * images/text files are displayed directly.
 */
function resolveFile(url?: string | null, previewUrl?: string | null): ResolvedFile | null {
    if (!url && !previewUrl) {
        return null;
    }

    const raw = (url ?? '').trim();

    // The backend converted an uploaded Office document into a PDF. Show that
    // PDF inline while keeping the original file for download.
    if (previewUrl) {
        return {
            kind: 'pdf',
            embedUrl: previewUrl,
            downloadUrl: raw || previewUrl,
            source: '',
        };
    }

    if (raw === '') {
        return null;
    }

    // Google Drive / Google Docs, Sheets and Slides files.
    const drive = raw.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (drive) {
        return {
            kind: 'web',
            embedUrl: `https://drive.google.com/file/d/${drive[1]}/preview`,
            downloadUrl: `https://drive.google.com/uc?export=download&id=${drive[1]}`,
            source: 'Google Drive',
        };
    }

    const googleDocs = raw.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/);
    if (googleDocs) {
        return {
            kind: 'web',
            embedUrl: `https://docs.google.com/${googleDocs[1]}/d/${googleDocs[2]}/preview`,
            downloadUrl: raw,
            source: 'Google Docs',
        };
    }

    // Dropbox share links render inline when using raw=1.
    if (/dropbox\.com/i.test(raw)) {
        const direct = raw.replace(/([?&])dl=0/i, '$1raw=1');

        return { kind: extensionOf(raw) === 'pdf' ? 'pdf' : 'web', embedUrl: direct, downloadUrl: direct, source: 'Dropbox' };
    }

    const extension = extensionOf(raw);

    if (extension === 'pdf') {
        return { kind: 'pdf', embedUrl: raw, downloadUrl: raw, source: 'PDF' };
    }

    if (OFFICE_EXTENSIONS.includes(extension)) {
        return {
            kind: 'office',
            embedUrl: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteUrl(raw))}`,
            downloadUrl: raw,
            source: extension.toUpperCase(),
        };
    }

    if (IMAGE_EXTENSIONS.includes(extension)) {
        return { kind: 'image', embedUrl: raw, downloadUrl: raw, source: 'Image' };
    }

    if (TEXT_EXTENSIONS.includes(extension)) {
        return { kind: 'text', embedUrl: raw, downloadUrl: raw, source: extension.toUpperCase() };
    }

    // OneDrive / SharePoint share links.
    if (/(1drv\.ms|onedrive\.live\.com|sharepoint\.com)/i.test(raw)) {
        return {
            kind: 'office',
            embedUrl: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(raw)}`,
            downloadUrl: raw,
            source: 'Office',
        };
    }

    // Any other public page or same-origin file.
    if (raw.startsWith('/') || /^https?:\/\//i.test(raw)) {
        return { kind: 'web', embedUrl: raw, downloadUrl: raw, source: 'Web' };
    }

    return null;
}

export default function PreviewFileViewer({ title, contentUrl, previewUrl, onOpen }: PreviewFileViewerProps) {
    const resolved = useMemo(() => resolveFile(contentUrl, previewUrl), [contentUrl, previewUrl]);
    const markedOpenRef = useRef(false);

    const handleLoad = () => {
        if (markedOpenRef.current) {
            return;
        }

        markedOpenRef.current = true;
        onOpen?.();
    };

    const handleDownload = () => {
        if (!markedOpenRef.current) {
            markedOpenRef.current = true;
            onOpen?.();
        }
    };

    return (
        <div className="space-y-3 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-700">
                <div className="flex min-w-0 items-center gap-2">
                    <File className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="truncate text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-200">
                        {title || 'File Attachment'}
                    </span>
                    {resolved && resolved.source && (
                        <span className="shrink-0 border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:border-slate-600 dark:text-slate-400">
                            {resolved.source}
                        </span>
                    )}
                </div>

                {resolved && (
                    <div className="flex shrink-0 items-center gap-3 text-[11px] font-medium">
                        <a
                            href={contentUrl ?? '#'}
                            target="_blank"
                            rel="noreferrer"
                            onClick={handleDownload}
                            className="inline-flex items-center gap-1 text-purple-600 hover:underline dark:text-purple-400"
                        >
                            <ExternalLink className="h-3 w-3" /> Open
                        </a>
                        <a
                            href={resolved.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            download
                            onClick={handleDownload}
                            className="inline-flex items-center gap-1 text-emerald-600 hover:underline dark:text-emerald-400"
                        >
                            <Download className="h-3 w-3" /> Download
                        </a>
                    </div>
                )}
            </div>

            {resolved ? (
                resolved.kind === 'image' ? (
                    <div className="flex justify-center border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-[#1e1f24]">
                        <img
                            src={resolved.embedUrl ?? ''}
                            alt={title}
                            className="max-h-[70vh] w-auto max-w-full object-contain"
                            onLoad={handleLoad}
                        />
                    </div>
                ) : resolved.embedUrl ? (
                    <div className="relative aspect-video w-full overflow-hidden border border-slate-200 bg-slate-900 dark:border-slate-700">
                        <iframe
                            src={resolved.embedUrl}
                            title={title || 'File attachment'}
                            className="absolute inset-0 h-full w-full"
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                            onLoad={handleLoad}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center dark:border-slate-700 dark:bg-[#1e1f24]">
                        <div className="flex h-14 w-14 items-center justify-center bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
                            <ImageIcon className="h-7 w-7" />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">This file cannot be previewed, but you can download it.</p>
                    </div>
                )
            ) : (
                <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center dark:border-slate-700 dark:bg-[#1e1f24]">
                    <div className="flex h-14 w-14 items-center justify-center bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
                        <File className="h-7 w-7" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
                        <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                            No file has been attached to this lesson yet.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
