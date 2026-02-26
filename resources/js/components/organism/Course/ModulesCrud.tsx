import { ArrowDown, ArrowUp } from "lucide-react"
import { Module } from "@/types/modules"
import { useModulesCrud } from "@/hooks/useModules"

import Modal from "@/components/atoms/Modal"
import Button from "@/components/atoms/Button"
import InputField from "@/components/molecules/InputField"
import ConfirmationDelete from "@/components/molecules/ConfirmationDelete"

interface ModulesCrudProps {
  course: {
    slug: string
  }
  modules: Module[]
}

export default function ModulesCrud({ course, modules }: ModulesCrudProps) {

  const crud = useModulesCrud(course.slug, modules)

  return (
    <>
      <div className="bg-white rounded-2xl p-4 shadow-sm">

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Modules</h2>

          <Button onClick={crud.openCreateModal}>
            Add Module
          </Button>
        </div>

        {crud.sortedModules.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No modules yet
          </p>
        ) : (
          <div className="space-y-2">
            {crud.sortedModules.map((module, index) => {

              const isFirst = index === 0
              const isLast = index === crud.sortedModules.length - 1

              return (
                <div
                  key={module.id}
                  onClick={() => crud.visitMaterials(module)}
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
                      onClick={() => crud.moveModule(module, "up")}
                    >
                      <ArrowUp className="h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      disabled={isLast}
                      onClick={() => crud.moveModule(module, "down")}
                    >
                      <ArrowDown className="h-4" />
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={() => crud.openEditModal(module)}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="danger"
                      onClick={() => crud.openDeleteModal(module)}
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
        open={crud.open}
        onClose={() => crud.setOpen(false)}
        title={crud.editingModule ? "Edit Module" : "Add Module"}
        footer={
          <>
            <Button variant="secondary" onClick={() => crud.setOpen(false)}>
              Cancel
            </Button>

            <Button onClick={crud.handleSubmit}>
              {crud.editingModule ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <InputField
          label="Module Title"
          value={crud.title}
          onChange={(e) => crud.setTitle(e.target.value)}
        />
      </Modal>

      <ConfirmationDelete
        open={crud.deleteModalOpen}
        onClose={() => crud.setOpen(false)}
        onConfirm={crud.handleConfirmDelete}
        isLoading={crud.isDeleting}
        title="Delete Module"
        message={`Module "${crud.selectedModule?.title}" will be deleted permanently.`}
      />
    </>
  )
}