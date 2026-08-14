import React from "react"
import { ExternalLink, Video } from "lucide-react"
import Button from "@/components/atoms/Button"

interface PreviewVideoViewerProps {
  title: string
  contentUrl?: string | null
}

function getEmbedUrl(url?: string | null): string | null {
  if (!url) return null

  // Check YouTube
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  )
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`
  }

  // Check Vimeo
  const vimeoMatch = url.match(
    /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/
  )
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }

  return null
}

export default function PreviewVideoViewer({
  title,
  contentUrl,
}: PreviewVideoViewerProps) {
  const embedUrl = getEmbedUrl(contentUrl)

  return (
    <div className="space-y-4">
      {/* Video Frame with Sharp Edges */}
      <div className="aspect-video w-full overflow-hidden rounded-none bg-black flex items-center justify-center">
        {contentUrl ? (
          embedUrl ? (
            <iframe
              src={embedUrl}
              className="h-full w-full border-0 block"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
            />
          ) : (
            <video
              src={contentUrl}
              controls
              className="h-full w-full object-contain block bg-black"
            />
          )
        ) : (
          <div className="flex flex-col items-center gap-3 p-8 text-center text-slate-400">
            <Video className="h-10 w-10 text-slate-500 animate-pulse" />
            <p className="text-xs font-medium text-slate-400">
              No video source URL available for this lesson.
            </p>
          </div>
        )}
      </div>

      {contentUrl && (
        <div className="flex flex-col gap-2 rounded-none border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span className="truncate font-mono text-[11px] text-slate-500">{contentUrl}</span>
          <a href={contentUrl} target="_blank" rel="noreferrer">
            <Button
              variant="outline"
              size="sm"
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
              className="!rounded-none"
            >
              Open External URL
            </Button>
          </a>
        </div>
      )}
    </div>
  )
}
