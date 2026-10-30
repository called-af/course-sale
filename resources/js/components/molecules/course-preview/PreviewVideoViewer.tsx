import { ExternalLink, Video } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

interface PreviewVideoViewerProps {
    title: string;
    contentUrl?: string | null;
    onCompleted?: () => void;
}

function getEmbedUrl(url?: string | null): string | null {
    if (!url) return null;

    const ytMatch = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
    );
    if (ytMatch) {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(origin)}`;
    }

    const vimeoMatch = url.match(
        /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/,
    );
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?dnt=1&api=1`;

    return null;
}

export default function PreviewVideoViewer({ title, contentUrl, onCompleted }: PreviewVideoViewerProps) {
    const embedUrl = getEmbedUrl(contentUrl);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const completedRef = useRef(false);

    const markCompleted = useCallback(() => {
        if (completedRef.current) return;
        completedRef.current = true;
        onCompleted?.();
    }, [onCompleted]);

    useEffect(() => {
        completedRef.current = false;
    }, [embedUrl]);

    useEffect(() => {
        if (!embedUrl) return;

        const handleMessage = (event: MessageEvent) => {
            if (!/youtube\.com|youtu\.be|vimeo\.com/.test(event.origin)) return;

            let payload: unknown = event.data;
            if (typeof payload === 'string') {
                try {
                    payload = JSON.parse(payload);
                } catch {
                    return;
                }
            }

            if (typeof payload !== 'object' || payload === null) return;

            const data = payload as { event?: string; info?: number | string };

            // YouTube player state 1 === playing. Starting the video is enough,
            // even if the student skips around or does not watch it to the end.
            if (data.event === 'onStateChange' && Number(data.info) === 1) {
                markCompleted();
            }

            // Vimeo player play/finish events.
            if (data.event === 'play' || data.event === 'finish') {
                markCompleted();
            }
        };

        window.addEventListener('message', handleMessage);

        return () => window.removeEventListener('message', handleMessage);
    }, [embedUrl, markCompleted]);

    const announcePlayerReady = () => {
        const sendHandshake = () => {
            const frame = iframeRef.current;
            if (!frame?.contentWindow) return;

            if (embedUrl?.includes('youtube.com')) {
                frame.contentWindow.postMessage(
                    JSON.stringify({ event: 'listening', id: 'course-video-player' }),
                    '*',
                );
            }

            if (embedUrl?.includes('vimeo.com')) {
                frame.contentWindow.postMessage(
                    JSON.stringify({ method: 'addEventListener', value: 'play' }),
                    '*',
                );
                frame.contentWindow.postMessage(
                    JSON.stringify({ method: 'addEventListener', value: 'finish' }),
                    '*',
                );
            }
        };

        sendHandshake();
        window.setTimeout(sendHandshake, 1000);
        window.setTimeout(sendHandshake, 2500);
    };

    return (
        <div className="overflow-hidden rounded-none bg-[#141416]">
            {/* Video area */}
            <div className="aspect-video w-full bg-black">
                {contentUrl ? (
                    embedUrl ? (
                        <iframe
                            ref={iframeRef}
                            id="course-video-player"
                            src={embedUrl}
                            className="block h-full w-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            title={title}
                            onLoad={() => {
                                // Opening the video iframe is enough to consider the content completed.
                                markCompleted();
                                announcePlayerReady();
                            }}
                        />
                    ) : (
                        <video
                            src={contentUrl}
                            controls
                            onPlay={markCompleted}
                            onEnded={markCompleted}
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
