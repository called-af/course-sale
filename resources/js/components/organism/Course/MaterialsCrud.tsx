import { SetStateAction, useState } from "react"
import {
  ChevronRight,
  ChevronDown,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import { useMaterials } from "@/hooks/useMaterial"
import { Material } from "@/types"

import Modal from "@/components/atoms/Modal"
import Button from "@/components/atoms/Button"
import InputField from "@/components/molecules/InputField"
import TextAreaField from "@/components/molecules/TextAreaField"
import ConfirmationDelete from "@/components/molecules/ConfirmationDelete"
import MaterialContents from "./MaterialContents"

interface Props {
  courseSlug: string
  moduleId: number
  materials: Material[]
}

export default function MaterialsCrud({
  courseSlug,
  moduleId,
  materials,
}: Props) {
  const crud = useMaterials(courseSlug, moduleId, materials)

  const [expanded, setExpanded] = useState<number | null>(null)

  function toggle(id: number) {
    setExpanded(prev => (prev === id ? null : id))
  }

  return (
    <>
      <div className="space-y-3">

        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm">
            Materials
          </h3>

          <Button onClick={crud.openCreate}>
            Add Materials
          </Button>
        </div>

        {crud.sortedMaterials.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No materials yet
          </p>
        ) : (
          <div className="space-y-2">

            {crud.sortedMaterials.map((material, index) => {
              const isFirst = index === 0
              const isLast = index === crud.sortedMaterials.length - 1
              const isOpen = expanded === material.id

              return (
                <div key={material.id} className="relative">

                  <div className="absolute left-3 top-0 bottom-0 w-px bg-neutral-200"></div>

                  <div className="flex items-center justify-between pl-8 py-2 hover:bg-neutral-50">

                    <div
                      className="flex items-center gap-2 cursor-pointer text-sm flex-1"
                      onClick={() => toggle(material.id)}
                    >
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}

                      <span>
                        {index + 1}. {material.title}
                      </span>
                    </div>

                    <div
                      className="flex gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="outline"
                        disabled={isFirst}
                        onClick={() => crud.moveMaterial(material, "up")}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        disabled={isLast}
                        onClick={() => crud.moveMaterial(material, "down")}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={() => crud.openEdit(material)}
                      >
                        Edit
                      </Button>

                      <Button
                        variant="danger"
                        onClick={() => crud.openDelete(material)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="pl-12 pr-4 pb-3">
                      <div className="border-l border-neutral-200 pl-6">

                        <MaterialContents
                          courseSlug={courseSlug}
                          moduleId={moduleId}
                          materialId={material.id}
                          contents={material.contents ?? []}
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
        title={crud.editing ? "Edit Material" : "Add Material"}
      >
        <div className="space-y-4">

          <InputField
            label="Title"
            value={crud.title}
            onChange={e => crud.setTitle(e.target.value)}
          />

          {crud.editing && (
            <TextAreaField
              label="Description"
              value={crud.description}
              onChange={(e: { target: { value: SetStateAction<string> } }) => crud.setDescription(e.target.value)}
            />
          )}

          <Button onClick={crud.submit}>
            {crud.editing ? "Update" : "Create"}
          </Button>

        </div>
      </Modal>

      <ConfirmationDelete
        open={crud.deleteOpen}
        onClose={() => crud.setDeleteOpen(false)}
        onConfirm={crud.confirmDelete}
        isLoading={crud.loadingDelete}
        title="Delete Material"
        message={`Material "${crud.selected?.title}" will be deleted.`}
      />
    </>
  )
}