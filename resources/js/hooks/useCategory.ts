import { useForm } from "@inertiajs/react"
import { useState } from "react"
import { route } from "ziggy-js"

interface Category {
  id: number
  name: string
  slug: string
  desc?: string
  img_url?: string
}

export function useCategory() {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const form = useForm({
    name: "",
    desc: "",
    img: null as File | null,
  })

  const {
    data,
    setData,
    post,
    put,
    delete: destroy,
    processing,
    reset,
  } = form

  const handleImgChange = (file: File) => {
    setData("img", file)
    setPreview(URL.createObjectURL(file))
  }

  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setData("name", category.name)
    setData("desc", category.desc ?? "")
    setPreview(category.img_url ?? null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setPreview(null)
    reset()
  }

  const submitCreate = () => {
    if (!data.name.trim()) return

    post(route("admin.categories.store"), {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        reset()
        setPreview(null)
      },
    })
  }

  const submitUpdate = (id: number, originalName: string) => {
    if (!data.name.trim()) return

    form.transform((d) => ({
      ...d,
      _method: "PUT",
    }))

    post(route("admin.categories.update", id), {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        setEditingId(null)
        setPreview(null)
        reset()
      },
    })
  }

  const openDeleteModal = (category: Category) => {
    setDeleteTarget(category)
  }

  const closeDeleteModal = () => {
    setDeleteTarget(null)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return

    destroy(route("admin.categories.destroy", deleteTarget.id), {
      preserveScroll: true,
      onSuccess: () => closeDeleteModal(),
    })
  }

  return {
    data,
    setData,
    processing,

    preview,
    handleImgChange,

    editingId,
    deleteTarget,

    startEdit,
    cancelEdit,

    submitCreate,
    submitUpdate,

    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
  }
}