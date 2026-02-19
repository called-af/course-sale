import { useForm } from "@inertiajs/react"
import { useState } from "react"

interface Category {
  id: number
  name: string
  slug: string
}

export function useCategory() {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const form = useForm({
    name: "",
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

  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setData("name", category.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    reset()
  }

  const submitCreate = () => {
    if (!data.name.trim()) return

    post("/admin/categories", {
      onSuccess: () => reset(),
    })
  }

  const submitUpdate = (id: number, originalName: string) => {
    if (!data.name.trim()) return
    if (data.name === originalName) return

    put(`/admin/categories/${id}`, {
      onSuccess: () => {
        setEditingId(null)
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

    destroy(`/admin/categories/${deleteTarget.id}`, {
      onSuccess: () => closeDeleteModal(),
    })
  }

  return {
    data,
    setData,
    processing,

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
