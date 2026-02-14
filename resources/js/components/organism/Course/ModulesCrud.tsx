import { useState } from "react"
import { router } from "@inertiajs/react"

import Modal from "@/components/atoms/Modal"
import Button from "@/components/atoms/Button"
import InputField from "@/components/molecules/InputField"
import ConfirmationDelete from "@/components/molecules/ConfirmationDelete"

import { ArrowDown, ArrowUp } from "lucide-react"

import { Module } from "@/types"

interface ModulesCrudProps {
  courseId: number
  modules: Module[]
}

export default function ModulesCrud({ courseId, modules }: ModulesCrudProps) {
  const [open, setOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [title, setTitle] = useState("")

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
      router.put(`/admin/modules/${editingModule.id}`, { title })
    } else {
      router.post(`/admin/modules`, {
        course_id: courseId,
        title,
      })
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

    router.delete(`/admin/modules/${selectedModule.id}`, {
      preserveScroll: true,
      onFinish: () => {
        setIsDeleting(false)
        setDeleteModalOpen(false)
        setSelectedModule(null)
      },
    })
  }

  function moveModule(module: Module, direction: "up" | "down") {
    router.put(
      `/admin/modules/${module.id}/move`,
      { direction },
      { preserveScroll: true }
    )
  }

  function openMaterials(module: Module) {
    router.visit(`/admin/modules/${module.id}`)
    // atau:
    // router.visit(`/admin/modules/${module.id}/materials`)
  }

  const sortedModules = [...modules].sort(
    (a, b) => a.sort_order - b.sort_order
  )

  return (
    <>
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Modules</h2>

          <Button onClick={openCreateModal}>
            Add Module
          </Button>
        </div>

        {sortedModules.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No modules yet
          </p>
        ) : (
          <div className="space-y-2">
            {sortedModules.map((module, index) => {
              const isFirst = index === 0
              const isLast = index === sortedModules.length - 1

              return (
                <div
                  key={module.id}
                  onClick={() => openMaterials(module)}
                  className="border rounded-xl p-3 text-sm flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition"
                >
                  <div>
                    {index + 1}. {module.title}
                  </div>

                  <div
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      disabled={isFirst}
                      onClick={() => moveModule(module, "up")}
                    >
                      <ArrowUp className="h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      disabled={isLast}
                      onClick={() => moveModule(module, "down")}
                    >
                      <ArrowDown className="h-4" />
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={() => openEditModal(module)}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="danger"
                      onClick={() => openDeleteModal(module)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingModule ? "Edit Module" : "Add Module"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>

            <Button onClick={handleSubmit}>
              {editingModule ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <InputField
          label="Module Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter module title"
        />
      </Modal>

      <ConfirmationDelete
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Module"
        message={`Module "${selectedModule?.title}" will be deleted permanently.`}
      />
    </>
  )
}