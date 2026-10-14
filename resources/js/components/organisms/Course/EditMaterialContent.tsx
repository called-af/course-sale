import { useState } from "react"
import { usePage } from "@inertiajs/react"
import {
  FileText, Video, File, Presentation, HelpCircle,
  ExternalLink, Clock, Save, CheckCircle2, Layout, Eye, Edit3
} from "lucide-react"
import Button from "@/components/atoms/Button"
import InputField from "@/components/molecules/InputField"
import SlateEditor from "@/components/molecules/SlateEditor"
import SlatePreview from "@/components/molecules/SlatePreview"
import { useMaterialContents } from "@/hooks/useMaterialContents"
import { MaterialContent } from "@/types"
import SelectField from "@/components/molecules/SelectField"
import QuizBuilder from "@/components/organisms/Course/QuizBuilder"

type ContentType = MaterialContent["type"]

const TYPES: {
  value: ContentType
  label: string
  desc: string
  icon: typeof FileText
  colorCls: string
  activeCls: string
}[] = [
  {
    value: "text",
    label: "Text / Article",
    desc: "Rich text & documentation",
    icon: FileText,
    colorCls: "text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-300 dark:bg-blue-950/50 dark:border-blue-900",
    activeCls: "border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20 text-blue-950 dark:border-blue-400 dark:bg-blue-950/60 dark:text-blue-100",
  },
  {
    value: "video",
    label: "Video Lesson",
    desc: "YouTube / Vimeo / URL",
    icon: Video,
    colorCls: "text-violet-600 bg-violet-50 border-violet-100 dark:text-violet-300 dark:bg-violet-950/50 dark:border-violet-900",
    activeCls: "border-violet-500 bg-violet-50/80 ring-2 ring-violet-500/20 text-violet-950 dark:border-violet-400 dark:bg-violet-950/60 dark:text-violet-100",
  },
  {
    value: "file",
    label: "File Attachment",
    desc: "PDF / Word / ZIP",
    icon: File,
    colorCls: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-900",
    activeCls: "border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20 text-emerald-950 dark:border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-100",
  },
  {
    value: "ppt",
    label: "Presentation",
    desc: "PPT slides / Google Slides",
    icon: Presentation,
    colorCls: "text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-300 dark:bg-amber-950/50 dark:border-amber-900",
    activeCls: "border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20 text-amber-950 dark:border-amber-400 dark:bg-amber-950/60 dark:text-amber-100",
  },
  {
    value: "quiz",
    label: "Quiz & Evaluation",
    desc: "Multiple choice & essay",
    icon: HelpCircle,
    colorCls: "text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-300 dark:bg-rose-950/50 dark:border-rose-900",
    activeCls: "border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/20 text-rose-950 dark:border-rose-400 dark:bg-rose-950/60 dark:text-rose-100",
  },
]

const URL_PLACEHOLDER: Partial<Record<ContentType, string>> = {
  video: "https://www.youtube.com/watch?v=...",
  file: "https://drive.google.com/file/d/...",
  ppt: "https://docs.google.com/presentation/d/...",
}

const URL_LABEL: Partial<Record<ContentType, string>> = {
  video: "Video Lesson URL",
  file: "File / Documentation URL",
  ppt: "Presentation Slide URL",
}

function formatDate(iso?: string) {
  if (!iso) return null
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

interface Props {
  courseSlug: string
  moduleId: number
  materialId: number
  content: MaterialContent
}

export default function EditMaterialContent({
  courseSlug,
  moduleId,
  materialId,
  content,
}: Props) {
  const [splitView, setSplitView] = useState(true)
  const { auth } = usePage().props as any
  const routePrefix = auth?.user?.role === "instructor" ? "instructor" : "admin"

  const form = useMaterialContents(
    courseSlug,
    moduleId,
    materialId,
    [content],
    routePrefix,
    content.id,
  )

  if (!form.editing) return null

  return (
    <div className="space-y-6">
      {/* Card 1: Main Content Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Main Content Settings</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Set the title, publication status, and content type for this lesson.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
              form.status === "published"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900"
                : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900"
            }`}>
              <span className={`w-1.5 h-1.5 ${form.status === "published" ? "bg-emerald-500" : "bg-amber-500"}`} />
              {form.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <InputField
              label="Material Content Title"
              name="title"
              value={form.title}
              onChange={(e) => form.setTitle(e.target.value)}
              placeholder="e.g., Introduction to HTML & Document Structure"
            />
          </div>

          <div>
            <SelectField
              label="Publication Status"
              value={form.status}
              onChange={(e) =>
                form.setStatus(e.target.value as "draft" | "published")
              }
              options={[
                { label: "Draft (Unpublished)", value: "draft" },
                { label: "Published (Student Accessible)", value: "published" },
              ]}
            />
          </div>
        </div>

        {/* Content Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Select Content Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {TYPES.map((t) => {
              const Icon = t.icon
              const isSelected = form.type === t.value

              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    form.setType(t.value)
                    if (t.value !== "quiz") form.setDuration("")
                  }}
                  className={`relative flex flex-col items-start p-4 border transition-all text-left group hover:scale-[1.01] ${
                    isSelected
                      ? t.activeCls
                      : "border-slate-200/90 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
                  }`}
                >
                  <div className={`p-2.5 border mb-3 transition-colors ${t.colorCls}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <span className="text-sm font-bold block leading-tight">{t.label}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-400 mt-1 leading-snug">
                    {t.desc}
                  </span>

                  {isSelected && (
                    <div className="absolute top-3 right-3 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4 fill-emerald-100" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Card 2: Content Specific Editor */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Media URL Input */}
        {(form.type === "video" || form.type === "file" || form.type === "ppt") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Links & Media</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Enter the media source URL for student access.</p>
              </div>
            </div>

            <div className="space-y-2">
              <InputField
                label={URL_LABEL[form.type] ?? "Media URL"}
                name="content_url"
                type="url"
                value={form.contentUrl}
                onChange={(e) => form.setContentUrl(e.target.value)}
                placeholder={URL_PLACEHOLDER[form.type]}
              />

              {form.contentUrl && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300 truncate max-w-md">{form.contentUrl}</span>
                  <a
                    href={form.contentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                  >
                    Open Link <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quiz Builder Container */}
        {form.type === "quiz" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-rose-500" />
                  Quiz Settings & Duration
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Set the time limit for students to complete the quiz.</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-32">
                  <InputField
                    label=""
                    name="duration"
                    type="number"
                    min={1}
                    value={form.duration}
                    onChange={(e) => form.setDuration(Number(e.target.value))}
                    placeholder="30"
                  />
                </div>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Minutes</span>
              </div>
            </div>

            {/* Quick Duration Presets */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Quick Presets:</span>
              {[15, 30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => form.setDuration(mins)}
                  className={`px-3 py-1 text-xs font-medium border transition-all ${
                    form.duration === mins
                      ? "bg-rose-50 border-rose-300 text-rose-700 font-semibold dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>

            <div className="pt-2">
              {content.id ? (
                <QuizBuilder
                  courseSlug={courseSlug}
                  moduleId={moduleId}
                  materialId={materialId}
                  contentId={content.id}
                  routePrefix={routePrefix}
                />
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 text-sm text-amber-700">
                  Save content first before adding quiz questions.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rich Text Editor */}
        {form.type === "text" && (
          <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Lesson Text Editor</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Write and compose rich text learning material.</p>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => setSplitView(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all ${
                    !splitView ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-100"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Editor
                </button>
                <button
                  type="button"
                  onClick={() => setSplitView(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all ${
                    splitView ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-100"
                  }`}
                >
                  <Layout className="w-3.5 h-3.5" /> Split View
                </button>
              </div>
            </div>

            {splitView ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Text Editor</span>
                  <div className="border border-slate-200/90 dark:border-slate-700 overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all">
                    <SlateEditor
                      key={content.id}
                      initialValue={content.content_text as any}
                      value={form.contentText}
                      onChange={form.setContentText}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-indigo-500" /> Student Preview
                  </span>
                  <div className="border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 p-4 min-h-[300px]">
                    <SlatePreview value={form.contentText} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-slate-200/90 dark:border-slate-700 overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all">
                <SlateEditor
                  key={content.id}
                  initialValue={content.content_text as any}
                  value={form.contentText}
                  onChange={form.setContentText}
                />
              </div>
            )}
          </div>
        )}

        {/* Footer Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Button onClick={form.update} size="md" leftIcon={<Save className="w-4 h-4" />} className="!rounded-none">
              Save Content Changes
            </Button>
          </div>

          {content.updated_at && (
            <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              Last updated: {formatDate(content.updated_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}