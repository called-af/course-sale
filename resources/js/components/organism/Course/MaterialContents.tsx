import { useMaterialContents } from "@/hooks/useMaterialContents"
import { MaterialContent } from "@/types"
import { useState } from "react"
import ConfirmationDelete from "@/components/molecules/ConfirmationDelete"
import Modal from "@/components/atoms/Modal"
import Button from "@/components/atoms/Button"
import InputField from "@/components/molecules/InputField"
import TextAreaField from "@/components/molecules/TextAreaField"
import { SetStateAction } from "react"
import { ArrowUp, ArrowDown } from "lucide-react"

interface Props {
  courseSlug: string
  moduleId: number
  materialId: number
  contents: MaterialContent[]
  editId?: number | null
}

export default function MaterialContents({
  courseSlug,
  moduleId,
  materialId,
  contents,
  editId,
}: Props) {
  const crud = useMaterialContents(
    courseSlug,
    moduleId,
    materialId,
    contents,
    editId
  )

  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [openDelete, setOpenDelete] = useState(false)

  const handleConfirmDelete = () => {
    if (deleteId) {
      crud.destroy(deleteId)
      setOpenDelete(false)
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-4">

      {crud.editing && (
        <div className="bg-white p-6 space-y-4 border">

          <h2 className="text-sm font-semibold">
            Edit Content
          </h2>

          <InputField
            label="Title"
            value={crud.title}
            onChange={e => crud.setTitle(e.target.value)}
          />

          <div className="space-y-1">
            <label className="text-xs">Type</label>
            <select
              value={crud.type}
              onChange={e => crud.setType(e.target.value as any)}
              className="p-2 w-full bg-white text-sm"
            >
              <option value="video">Video</option>
              <option value="text">Text</option>
              <option value="quiz">Quiz</option>
              <option value="file">File</option>
              <option value="ppt">PPT</option>
            </select>
          </div>

          {(crud.type === "video" || crud.type === "file" || crud.type === "ppt") && (
            <InputField
              label="Content URL"
              value={crud.contentUrl}
              onChange={e => crud.setContentUrl(e.target.value)}
            />
          )}

          {crud.type === "text" && (
            <TextAreaField
              label="Content Text"
              value={crud.contentText}
              onChange={(e: { target: { value: SetStateAction<string> } }) =>
                crud.setContentText(e.target.value)
              }
            />
          )}

          {crud.type === "video" && (
            <InputField
              label="Duration (seconds)"
              type="number"
              value={crud.duration}
              onChange={e => crud.setDuration(Number(e.target.value))}
            />
          )}

          <div className="flex gap-2">
            <Button onClick={crud.update}>Save</Button>
            <Button variant="secondary" onClick={() => history.back()}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">

        <div className="flex justify-between items-center">
          <h4 className="text-xs font-medium">
            Contents
          </h4>

          <Button onClick={crud.openCreate}>
            Add Content
          </Button>
        </div>

        {crud.sortedContents.length === 0 ? (
          <p className="text-xs text-neutral-500">
            No content yet
          </p>
        ) : (
          <div className="space-y-1">

            {crud.sortedContents.map((item, index) => {
              const isFirst = index === 0
              const isLast = index === crud.sortedContents.length - 1

              return (
                <div key={item.id} className="relative">

                  <div className="absolute left-2 top-0 bottom-0 w-px bg-neutral-200"></div>

                  <div className="pl-6 py-2 flex justify-between items-center text-xs bg-white hover:bg-neutral-50">

                    <div>
                      {index + 1}. {item.title}
                      <span className="ml-2 text-neutral-400">
                        ({item.type})
                      </span>
                    </div>

                    <div className="flex gap-1">

                      <Button
                        variant="outline"
                        disabled={isFirst}
                        onClick={() => crud.moveContent(item, "up")}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>

                      <Button
                        variant="outline"
                        disabled={isLast}
                        onClick={() => crud.moveContent(item, "down")}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={() => crud.editPage(item.id)}
                      >
                        Edit
                      </Button>

                      <Button
                        variant="danger"
                        onClick={() => {
                          setDeleteId(item.id)
                          setOpenDelete(true)
                        }}
                      >
                        Delete
                      </Button>

                    </div>
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
        title="Add Content"
      >
        <div className="space-y-4">

          <InputField
            label="Title"
            value={crud.title}
            onChange={e => crud.setTitle(e.target.value)}
          />

          <Button onClick={crud.create}>
            Create
          </Button>

        </div>
      </Modal>

      <ConfirmationDelete
        open={openDelete}
        onClose={() => {
          setOpenDelete(false)
          setDeleteId(null)
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}