import { ChangeEvent } from "react"
import { useMaterialsCrud } from "@/hooks/useMaterial"

import Modal from "@/components/atoms/Modal"
import Button from "@/components/atoms/Button"
import InputField from "@/components/molecules/InputField"
import TextAreaField from "@/components/molecules/TextAreaField"
import ConfirmationDelete from "@/components/molecules/ConfirmationDelete"

import { Material } from "@/types"

interface MaterialsCrudProps {
  courseSlug: string
  moduleId: number
  materials: Material[]
}

export default function MaterialsCrud({
  courseSlug,
  moduleId,
  materials,
}: MaterialsCrudProps) {

  const crud = useMaterialsCrud(courseSlug, moduleId, materials)

  return (
    <>
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Materials</h2>

          <Button onClick={crud.openCreateModal}>
            Add Material
          </Button>
        </div>

        {crud.sortedMaterials.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No materials yet
          </p>
        ) : (
          <div className="space-y-2">
            {crud.sortedMaterials.map((material, index) => (
              <div
                key={material.id}
                className="border rounded-xl p-3 text-sm flex items-center justify-between hover:bg-neutral-50 transition"
              >
                <div>
                  {index + 1}. {material.title}

                  {material.is_preview && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                      Preview
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => crud.openEditModal(material)}
                  >
                    Edit
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() => crud.openDeleteModal(material)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={crud.open}
        onClose={() => crud.setOpen(false)}
        title={crud.editingMaterial ? "Edit Material" : "Add Material"}
        footer={
          <>
            <Button variant="secondary" onClick={() => crud.setOpen(false)}>
              Cancel
            </Button>

            <Button onClick={crud.handleSubmit}>
              {crud.editingMaterial ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <InputField
            label="Material Title"
            value={crud.title}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              crud.setTitle(e.target.value)
            }
          />

          {crud.editingMaterial && (
            <>
              <TextAreaField
                label="Description"
                value={crud.description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  crud.setDescription(e.target.value)
                }
              />

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={crud.isPreview}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    crud.setIsPreview(e.target.checked)
                  }
                />
                Preview Material
              </label>
            </>
          )}
        </div>
      </Modal>

      <ConfirmationDelete
        open={crud.deleteModalOpen}
        onClose={() => crud.setDeleteModalOpen(false)}
        onConfirm={crud.handleConfirmDelete}
        isLoading={crud.isDeleting}
        title="Delete Material"
        message={`Material "${crud.selectedMaterial?.title}" will be deleted permanently.`}
      />
    </>
  )
}