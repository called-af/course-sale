import { useForm } from "@inertiajs/react"
import { useState } from "react"
import { route } from "ziggy-js"
import { Tag } from "@/types"

export function useTag() {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

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
    errors,
    reset,
    clearErrors,
  } = form

  const openCreate = () => {
    reset()
    clearErrors()
    setIsCreateOpen(true)
  }

  const closeCreate = () => {
    setIsCreateOpen(false)
    reset()
    clearErrors()
  }

  const submitCreate = () => {
    if (!data.name.trim()) return

    post(route("admin.tags.store"), {
      preserveScroll: true,
      onSuccess: () => {
        reset()
        setIsCreateOpen(false)
      },
    })
  }

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id)
    clearErrors()
    setData({
      name: tag.name,
    })
    setIsEditOpen(true)
  }

  const closeEdit = () => {
    setIsEditOpen(false)
    setEditingId(null)
    clearErrors()
    reset()
  }

  const submitUpdate = (id: number) => {
    if (!data.name.trim()) return

    put(route("admin.tags.update", id), {
      preserveScroll: true,
      onSuccess: () => {
        setEditingId(null)
        reset()
        setIsEditOpen(false)
      },
    })
  }

  const openDeleteModal = (tag: Tag) => {
    setDeleteTarget(tag)
  }

  const closeDeleteModal = () => {
    setDeleteTarget(null)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return

    destroy(route("admin.tags.destroy", deleteTarget.id), {
      preserveScroll: true,
      onSuccess: () => {
        closeDeleteModal()
      },
    })
  }

  return {
    data,
    setData,
    errors,
    processing,

    editingId,
    deleteTarget,

    isCreateOpen,
    isEditOpen,
    openCreate,
    closeCreate,
    closeEdit,

    startEdit,
    submitCreate,
    submitUpdate,

    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
  }
}
