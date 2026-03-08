import { useState, useMemo } from "react"
import { router } from "@inertiajs/react"
import { Material } from "@/types"

export function useMaterials(
  courseSlug: string,
  moduleId: number,
  materials: Material[]
) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Material | null>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isPreview, setIsPreview] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<Material | null>(null)
  const [loadingDelete, setLoadingDelete] = useState(false)

  const baseUrl = `/admin/courses/${courseSlug}/modules/${moduleId}/materials`

  const sorted = useMemo(() => {
    return [...materials].sort((a, b) => a.sort_order - b.sort_order)
  }, [materials])

  function reset() {
    setTitle("")
    setDescription("")
    setIsPreview(false)
  }

  function openCreate() {
    setEditing(null)
    reset()
    setOpen(true)
  }

  function openEdit(material: Material) {
    setEditing(material)
    setTitle(material.title)
    setDescription(material.description ?? "")
    setIsPreview(material.is_preview)
    setOpen(true)
  }

  function submit() {
    if (!title.trim()) return

    const data = {
      title,
      description,
      is_preview: isPreview,
    }

    if (editing) {
      router.put(`${baseUrl}/${editing.id}`, data, {
        onSuccess: () => setOpen(false),
      })
    } else {
      router.post(baseUrl, { title }, {
        onSuccess: () => setOpen(false),
      })
    }
  }

  function openDelete(material: Material) {
    setSelected(material)
    setDeleteOpen(true)
  }

  function confirmDelete() {
    if (!selected) return

    setLoadingDelete(true)

    router.delete(`${baseUrl}/${selected.id}`, {
      preserveScroll: true,
      onFinish: () => {
        setLoadingDelete(false)
        setDeleteOpen(false)
        setSelected(null)
      },
    })
  }

  return {
    open,
    setOpen,
    editing,

    title,
    setTitle,

    description,
    setDescription,

    isPreview,
    setIsPreview,

    deleteOpen,
    setDeleteOpen,
    selected,
    loadingDelete,

    sorted,

    openCreate,
    openEdit,
    submit,
    openDelete,
    confirmDelete,
  }
}