import { useState, useMemo, useEffect } from "react"
import { router } from "@inertiajs/react"
import { MaterialContent } from "@/types"

export function useMaterialContents(
  courseSlug: string,
  moduleId: number,
  materialId: number,
  contents: MaterialContent[],
  editId?: number | null
) {
  const baseUrl =
    `/admin/courses/${courseSlug}/modules/${moduleId}/materials/${materialId}/contents`

  const [open, setOpen] = useState(false)

  const [title, setTitle] = useState("")
  const [type, setType] = useState<MaterialContent["type"]>("text")
  const [contentUrl, setContentUrl] = useState("")
  const [contentText, setContentText] = useState("")
  const [duration, setDuration] = useState<number | "">("")

  const sorted = useMemo(() => {
    return [...contents].sort((a, b) => a.sort_order - b.sort_order)
  }, [contents])

  const editing = useMemo(() => {
    if (!editId) return null
    return contents.find(c => c.id === editId) ?? contents[0] ?? null
  }, [editId, contents])

  useEffect(() => {
    if (!editing) return

    setTitle(editing.title)
    setType(editing.type)
    setContentUrl(editing.content_url ?? "")
    setContentText(editing.content_text ?? "")
    setDuration(editing.duration ?? "")
  }, [editing])

  function openCreate() {
    setTitle("")
    setType("text")
    setContentUrl("")
    setContentText("")
    setDuration("")
    setOpen(true)
  }

  function create() {
    if (!title.trim()) return

    router.post(
      baseUrl,
      { title },
      {
        onSuccess: () => setOpen(false),
      }
    )
  }

  function update() {
    if (!editing) return

    router.put(`${baseUrl}/${editing.id}`, {
      title,
      type,
      content_url: contentUrl || null,
      content_text: contentText || null,
      duration: duration || null,
    })
  }

  function destroy(id: number) {
    router.delete(`${baseUrl}/${id}`, {
      preserveScroll: true,
    })
  }

  function editPage(id: number) {
    router.get(`${baseUrl}/${id}/edit`)
  }

  return {
    open,
    setOpen,

    title,
    setTitle,

    type,
    setType,

    contentUrl,
    setContentUrl,

    contentText,
    setContentText,

    duration,
    setDuration,

    sorted,
    editing,

    openCreate,
    create,
    update,
    destroy,
    editPage,
  }
}