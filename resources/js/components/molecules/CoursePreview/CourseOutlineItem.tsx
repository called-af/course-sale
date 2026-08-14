import React from "react"
import { FileText, HelpCircle, File, Presentation, Video } from "lucide-react"

export interface CourseOutlineItemProps {
  id: number
  title: string
  type: string
  duration?: number | null
  isActive: boolean
  onClick: () => void
}

const TYPE_ICONS: Record<string, typeof FileText> = {
  video: Video,
  text: FileText,
  quiz: HelpCircle,
  file: File,
  ppt: Presentation,
}

export default function CourseOutlineItem({
  title,
  type,
  duration,
  isActive,
  onClick,
}: CourseOutlineItemProps) {
  const Icon = TYPE_ICONS[type] ?? FileText

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-none px-3 py-2.5 text-left transition-colors ${
        isActive
          ? "bg-purple-600 text-white font-medium shadow-xs"
          : "text-slate-700 hover:bg-slate-100/80"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Icon
          className={`h-4 w-4 shrink-0 ${
            isActive ? "text-white" : "text-slate-400"
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium leading-tight">{title}</p>
        </div>
        {duration ? (
          <span
            className={`text-[11px] shrink-0 ${
              isActive ? "text-purple-200" : "text-slate-400"
            }`}
          >
            {duration}m
          </span>
        ) : null}
      </div>
    </button>
  )
}
