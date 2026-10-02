import { ExternalLink, Video } from 'lucide-react';

interface PreviewVideoViewerProps {
    title: string;
    contentUrl?: string | null;
}

function getEmbedUrl(url?: string | null): string | null {
    if (!url) return null;

    const ytMatch = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
    );
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;

    const vimeoMatch = url.match(
        /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/,
    );
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1`;

    return null;
}

export default function PreviewVideoViewer({ title, contentUrl }: PreviewVideoViewerProps) {
    const embedUrl = getEmbedUrl(contentUrl);

    return (
        <div className="overflow-hidden rounded-none bg-[#0a0a0f]">
            {/* Video area */}
            <div className="aspect-video w-full bg-black">
                {contentUrl ? (
                    embedUrl ? (
                        <iframe
                            src={embedUrl}
                            className="block h-full w-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            title={title}
                        />
                    ) : (
                        <video
                            src={contentUrl}
                            controls
                            className="block h-full w-full bg-black object-contain"
                        />
                    )
                ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-slate-600">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
                            <Video className="h-7 w-7 text-slate-500" />
                        </div>
                        <p className="text-xs font-medium text-slate-500">No video available for this lesson.</p>
                    </div>
                )}
            </div>

            {/* Subtle bottom bar — open external only when needed */}
            {contentUrl && !embedUrl && (
                <div className="flex items-center justify-between bg-[#111118] px-4 py-2">
                    <span className="truncate font-mono text-[11px] text-slate-600">{contentUrl}</span>
                    <a
                        href={contentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-3 flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-white"
                    >
                        <ExternalLink size={13} />
                        Open
                    </a>
                </div>
            )}
        </div>
    );
}
