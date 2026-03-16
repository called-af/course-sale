import { SetStateAction, useState } from "react"
import { ChevronRight, ChevronDown } from "lucide-react"
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
      <div className="space-y-4">

        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm">
            Materials
          </h3>

          <Button onClick={crud.openCreate}>
            Add
          </Button>
        </div>

        {crud.sorted.length === 0 && (
          <div className="text-xs text-neutral-500 py-2">
            No materials yet
          </div>
        )}

        <div className="space-y-1">

          {crud.sorted.map((material, i) => {
            const open = expanded === material.id

            return (
              <div key={material.id} className="relative">

                <div className="absolute left-2 top-0 bottom-0 w-px bg-neutral-200"></div>

                <div className="pl-6 py-2">

                  <div className="flex justify-between items-center">

                    <div
                      className="flex items-center gap-2 cursor-pointer flex-1 text-sm"
                      onClick={() => toggle(material.id)}
                    >
                      {open ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}

                      <span>
                        {i + 1}. {material.title}
                      </span>
                    </div>

                    <div className="flex gap-2">

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

                  {open && (
                    <div className="mt-3 ml-4 border-l border-neutral-200 pl-4">
                      <MaterialContents
                        courseSlug={courseSlug}
                        moduleId={moduleId}
                        materialId={material.id}
                        contents={material.contents ?? []}
                      />
                    </div>
                  )}

                </div>
              </div>
            )
          })}

        </div>
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
            <>
              <TextAreaField
                label="Description"
                value={crud.description}
                onChange={(e: { target: { value: SetStateAction<string> } }) =>
                  crud.setDescription(e.target.value)
                }
              />

              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={crud.isPreview}
                  onChange={e => crud.setIsPreview(e.target.checked)}
                />
                Preview
              </label>
            </>
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