import { ExternalLink, Presentation } from "lucide-react"
import React from "react"
import Button from "@/components/atoms/Button"

interface PreviewPptViewerProps {
  title: string
  contentUrl?: string | null
  onOpen?: () => void
}

export default function PreviewPptViewer({
  title,
  contentUrl,
  onOpen,
}: PreviewPptViewerProps) {
  return (
    <div className="py-8 text-center space-y-4">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-none bg-amber-50 text-amber-600">
        <Presentation className="w-7 h-7" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
          Presentation slide deck for learning material.
        </p>
      </div>
      {contentUrl ? (
        <a href={contentUrl} target="_blank" rel="noreferrer" onClick={onOpen}>
          <Button
            variant="primary"
            size="md"
            rightIcon={<ExternalLink className="w-4 h-4" />}
            className="!rounded-none"
          >
            Open Presentation Slides
          </Button>
        </a>
      ) : (
        <div className="text-xs text-slate-400">No presentation URL provided.</div>
      )}
    </div>
  )
}
