import Button from "@/components/atoms/Button"
import InputField from "@/components/molecules/InputField"
import { useMaterialContents } from "@/hooks/useMaterialContents"
import { MaterialContent } from "@/types"

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

  const form = useMaterialContents(
    courseSlug,
    moduleId,
    materialId,
    [content],      // penting
    content.id      // penting
  )

  if (!form.editing) return null

  return (
    <div className="space-y-4 max-w-xl">

      <InputField
        label="Title"
        value={form.title}
        onChange={(e) => form.setTitle(e.target.value)}
      />

      <select
        value={form.type}
        onChange={(e) => form.setType(e.target.value as any)}
        className="border rounded px-3 py-2 w-full"
      >
        <option value="text">Text</option>
        <option value="video">Video</option>
        <option value="file">File</option>
        <option value="ppt">PPT</option>
        <option value="quiz">Quiz</option>
      </select>

      {form.type === "video" && (
        <InputField
          label="Video URL"
          value={form.contentUrl}
          onChange={(e) => form.setContentUrl(e.target.value)}
        />
      )}

      {form.type === "text" && (
        <textarea
          value={form.contentText}
          onChange={(e) => form.setContentText(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
      )}

      <InputField
        label="Duration"
        type="number"
        value={form.duration}
        onChange={(e) => form.setDuration(Number(e.target.value))}
      />

      <Button onClick={form.update}>
        Update Content
      </Button>

    </div>
  )
}