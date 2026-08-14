import React from "react"
import SlatePreview from "@/components/molecules/SlatePreview"

interface PreviewTextViewerProps {
  contentText: any
}

function parseSlateText(contentText: any) {
  if (!contentText) return []
  if (typeof contentText === "string") {
    try {
      return JSON.parse(contentText)
    } catch {
      return [{ type: "paragraph", children: [{ text: contentText }] }]
    }
  }
  return contentText
}

export default function PreviewTextViewer({
  contentText,
}: PreviewTextViewerProps) {
  const value = parseSlateText(contentText)

  return (
    <div className="py-2">
      <SlatePreview value={value} />
    </div>
  )
}
