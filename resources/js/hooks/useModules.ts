import { useState } from "react"
import { router } from "@inertiajs/react"
import { Module } from "@/types/modules"

export function useModulesCrud(courseSlug: string, modules: Module[]) {

  const [open, setOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [title, setTitle] = useState("")

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const sortedModules = [...modules].sort(
    (a, b) => a.sort_order - b.sort_order
  )

  function openCreateModal() {
    setEditingModule(null)
    setTitle("")
    setOpen(true)
  }

  function openEditModal(module: Module) {
    setEditingModule(module)
    setTitle(module.title)
    setOpen(true)
  }

  function handleSubmit() {
    if (!title.trim()) return

    if (editingModule) {
      router.put(
        `/admin/courses/${courseSlug}/modules/${editingModule.id}`,
        { title }
      )
    } else {
      router.post(
        `/admin/courses/${courseSlug}/modules`,
        { title }
      )
    }

    setOpen(false)
  }

  function openDeleteModal(module: Module) {
    setSelectedModule(module)
    setDeleteModalOpen(true)
  }

  function handleConfirmDelete() {
    if (!selectedModule) return

    setIsDeleting(true)

    router.delete(
      `/admin/courses/${courseSlug}/modules/${selectedModule.id}`,
      {
        preserveScroll: true,
        onFinish: () => {
          setIsDeleting(false)
          setDeleteModalOpen(false)
          setSelectedModule(null)
        },
      }
    )
  }

  function moveModule(module: Module, direction: "up" | "down") {
    router.put(
      `/admin/courses/${courseSlug}/modules/${module.id}/move`,
      { direction },
      { preserveScroll: true }
    )
  }

  function visitMaterials(module: Module) {
    router.visit(`/admin/courses/${courseSlug}/modules/${module.id}`)
  }

  return {
    /* state */
    open,
    setOpen,
    editingModule,
    title,
    setTitle,

    deleteModalOpen,
    selectedModule,
    isDeleting,

    sortedModules,

    /* actions */
    openCreateModal,
    openEditModal,
    handleSubmit,
    openDeleteModal,
    handleConfirmDelete,
    moveModule,
    visitMaterials,
  }
}