import { useState } from "react"
import Button from "@/components/atoms/Button"
import InputField from "@/components/molecules/InputField"
import SlateEditor from "@/components/molecules/SlateEditor"
import SlatePreview from "@/components/molecules/SlatePreview"
import { useMaterialContents } from "@/hooks/useMaterialContents"
import { MaterialContent } from "@/types"
import SelectField from "@/components/molecules/SelectField"

type ContentType = MaterialContent["type"]

const TYPES: {
  value: ContentType
  label: string
  desc: string
}[] = [
    { value: "text", label: "Teks", desc: "Rich text" },
    { value: "video", label: "Video", desc: "URL video" },
    { value: "file", label: "File", desc: "Dokumen" },
    { value: "ppt", label: "Presentasi", desc: "PowerPoint" },
    { value: "quiz", label: "Quiz", desc: "Dengan timer" },
  ]

const URL_PLACEHOLDER: Partial<Record<ContentType, string>> = {
  video: "https://youtube.com/watch?v=...",
  file: "https://drive.google.com/...",
  ppt: "https://docs.google.com/presentation/...",
}

const URL_LABEL: Partial<Record<ContentType, string>> = {
  video: "Video URL",
  file: "File URL",
  ppt: "Presentasi URL",
}

function formatDate(iso?: string) {
  if (!iso) return null
  return new Intl.DateTimeFormat("id-ID", {
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

  const form = useMaterialContents(
    courseSlug,
    moduleId,
    materialId,
    [content],
    content.id,
  )

  if (!form.editing) return null

  return (
    <div className="space-y-6">

      <InputField
        label="Judul Konten"
        name="title"
        value={form.title}
        onChange={(e) => form.setTitle(e.target.value)}
        placeholder="Masukkan judul konten..."
      />
      <SelectField
        label="Status"
        value={form.status}
        onChange={(e) =>
          form.setStatus(e.target.value as "draft" | "published")
        }
        options={[
          { label: "Draft", value: "draft" },
          { label: "Published", value: "published" },
        ]}
      />

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Tipe Konten
        </label>
        <div className="grid grid-cols-5 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                form.setType(t.value)
                if (t.value !== "quiz") form.setDuration("")
              }}
              className={`flex flex-col items-center gap-1.5 p-3 border-2 transition-all text-center
                ${form.type === t.value
                  ? "border-violet-500 bg-violet-50 text-violet-700 shadow-sm"
                  : "border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50"
                }
              `}
            >
              <span className="text-xs font-semibold leading-none">{t.label}</span>
              <span className="text-[10px] text-gray-400 leading-none hidden sm:block">
                {t.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {(form.type === "video" || form.type === "file" || form.type === "ppt") && (
        <div>
          <InputField
            label={URL_LABEL[form.type] ?? "URL"}
            name="content_url"
            type="url"
            value={form.contentUrl}
            onChange={(e) => form.setContentUrl(e.target.value)}
            placeholder={URL_PLACEHOLDER[form.type]}
          />
          {form.contentUrl && (
            <a
              href={form.contentUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-xs text-violet-600 hover:underline"
            >
              Buka URL ↗
            </a>
          )}
        </div>
      )}

      {form.type === "quiz" && (
        <div className="flex items-end gap-3">
          <div className="w-36">
            <InputField
              label="Durasi Quiz"
              name="duration"
              type="number"
              min={1}
              value={form.duration}
              onChange={(e) => form.setDuration(Number(e.target.value))}
              placeholder="30"
            />
          </div>
          <span className="pb-2 text-sm text-gray-500">menit</span>
        </div>
      )}

      {form.type === "text" && (
        <div>

          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Konten Teks
            </label>

            <div className="flex items-center gap-0.5 bg-gray-100 p-1">
              <button
                onClick={() => setSplitView(false)}
                className={`px-3 py-1 text-xs font-medium transition-all
                  ${!splitView ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Editor
              </button>
              <button
                onClick={() => setSplitView(true)}
                className={`px-3 py-1 text-xs font-medium transition-all
                  ${splitView ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                Split View
              </button>
            </div>
          </div>

          {splitView ? (
            <div className="grid grid-cols-2 gap-4 items-start">
              <div>
                <p className="text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Editor</p>
                <SlateEditor
                  key={content.id}
                  initialValue={content.content_text as any}
                  value={form.contentText}
                  onChange={form.setContentText}
                />
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Preview</p>
                <SlatePreview value={form.contentText} />
              </div>
            </div>
          ) : (
            <SlateEditor
              key={content.id}
              initialValue={content.content_text as any}
              value={form.contentText}
              onChange={form.setContentText}
            />
          )}

        </div>
      )}

      <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
        <Button onClick={form.update}>
          Simpan Konten
        </Button>

        {content.updated_at && (
          <p className="text-xs text-gray-400">
            Terakhir diubah: {formatDate(content.updated_at)}
          </p>
        )}
      </div>

    </div>
  )
}