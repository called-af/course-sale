import { ArrowUp, ArrowDown, ChevronRight, ChevronDown } from "lucide-react"
import { Module } from "@/types/modules"
import { useModules } from "@/hooks/useModules"
import MaterialsCrud from "./MaterialsCrud"

import Modal from "@/components/atoms/Modal"
import Button from "@/components/atoms/Button"
import InputField from "@/components/molecules/InputField"
import SelectField from "@/components/molecules/SelectField"
import ConfirmationDelete from "@/components/molecules/ConfirmationDelete"
import Title from "@/components/atoms/Title"

interface Props {
  course: {
    slug: string
  }
  modules: Module[]
}

export default function ModulesTree({ course, modules }: Props) {
  const crud = useModules(course.slug, modules)

  return (
    <>
      <div className="bg-white shadow-sm p-6 space-y-5">

        <div className="flex items-center justify-between">
          <Title as="h1" className="font-semibold text-lg">
            Course Structure
          </Title>

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
              const isOpen = crud.expandedModule === module.id

              return (
                <div key={module.id} className="relative">

                  <div className="absolute left-3 top-0 bottom-0 w-px bg-neutral-200"></div>

                  <div
                    className="flex items-center justify-between pl-8 py-3 hover:bg-neutral-50"
                  >
                    <div
                      className="flex items-center gap-2 cursor-pointer font-medium"
                      onClick={() => crud.toggleExpand(module.id)}
                    >
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}

                      <div className="flex items-center gap-2">
                        <span>
                          {index + 1}. {module.title}
                        </span>

                        <span
                          className={`text-xs px-2 py-0.5 rounded ${module.status === "published"
                            ? "bg-green-100 text-green-600"
                            : "bg-yellow-100 text-yellow-600"
                            }`}
                        >
                          {module.status}
                        </span>
                      </div>
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
                        <ArrowUp className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        disabled={isLast}
                        onClick={() => crud.moveModule(module, "down")}
                      >
                        <ArrowDown className="h-4 w-4" />
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

                  {isOpen && (
                    <div className="pl-12 pr-4 pb-4">
                      <div className="border-l border-neutral-200 pl-6">

                        <MaterialsCrud
                          courseSlug={course.slug}
                          moduleId={module.id}
                          materials={module.materials ?? []}
                        />

                      </div>
                    </div>
                  )}
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
            <Button
              variant="secondary"
              onClick={() => crud.setOpen(false)}
            >
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
        <SelectField
          label="Status"
          value={crud.status}
          onChange={(e) =>
            crud.setStatus(e.target.value as "draft" | "published")
          }
          options={[
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
          ]}
        />
      </Modal>

      <ConfirmationDelete
        open={crud.deleteModalOpen}
        onClose={() => crud.setDeleteModalOpen(false)}
        onConfirm={crud.handleConfirmDelete}
        isLoading={crud.isDeleting}
        title="Delete Module"
        message={`Module "${crud.selectedModule?.title}" will be deleted permanently.`}
      />
    </>
  )
}