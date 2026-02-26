import { useState } from "react"
import { router } from "@inertiajs/react"
import { Material } from "@/types"

export function useMaterialsCrud(
  courseSlug: string,
  moduleId: number,
  materials: Material[]
) {
  const [open, setOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isPreview, setIsPreview] = useState(false)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const sortedMaterials = [...materials].sort(
    (a, b) => a.sort_order - b.sort_order
  )

  function openCreateModal() {
    setEditingMaterial(null)
    setTitle("")
    setDescription("")
    setIsPreview(false)
    setOpen(true)
  }

  function openEditModal(material: Material) {
    setEditingMaterial(material)
    setTitle(material.title)
    setDescription(material.description ?? "")
    setIsPreview(material.is_preview)
    setOpen(true)
  }

  function handleSubmit() {
    if (!title.trim()) return

    if (editingMaterial) {
      router.put(
        `/admin/courses/${courseSlug}/modules/${moduleId}/materials/${editingMaterial.id}`,
        {
          title,
          description,
          is_preview: isPreview,
        }
      )
    } else {
      router.post(
        `/admin/courses/${courseSlug}/modules/${moduleId}/materials`,
        { title }
      )
    }

    setOpen(false)
  }

  function openDeleteModal(material: Material) {
    setSelectedMaterial(material)
    setDeleteModalOpen(true)
  }

  function handleConfirmDelete() {
    if (!selectedMaterial) return

    setIsDeleting(true)

    router.delete(
      `/admin/courses/${courseSlug}/modules/${moduleId}/materials/${selectedMaterial.id}`,
      {
        preserveScroll: true,
        onFinish: () => {
          setIsDeleting(false)
          setDeleteModalOpen(false)
          setSelectedMaterial(null)
        },
      }
    )
  }

  return {
    /* state */
    open,
    setOpen,
    editingMaterial,

    title,
    setTitle,

    description,
    setDescription,

    isPreview,
    setIsPreview,

    deleteModalOpen,
    selectedMaterial,
    isDeleting,
    setDeleteModalOpen,

    sortedMaterials,

    /* actions */
    openCreateModal,
    openEditModal,
    handleSubmit,
    openDeleteModal,
    handleConfirmDelete,
  }
}