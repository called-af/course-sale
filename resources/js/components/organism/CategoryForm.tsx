import Modal from "@/components/atoms/Modal"
import InputField from "@/components/molecules/InputField"
import ChooseFile from "@/components/molecules/ChooseFile"
import Button from "@/components/atoms/Button"

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  processing: boolean

  title: string

  data: {
    name: string
    desc: string
    img: File | null
  }

  setData: (key: "name" | "desc" | "img", value: any) => void

  preview: string | null
  onImgChange: (file: File) => void
}

export default function CategoryForm({
  open,
  onClose,
  onSubmit,
  processing,
  title,
  data,
  setData,
  preview,
  onImgChange,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            onClick={onSubmit}
            disabled={processing || !data.name.trim()}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="flex gap-4 items-start">

        <div className="w-24 shrink-0">
          <ChooseFile
            label="Logo"
            aspect="square"
            value={preview}
            onChange={(file) => file && onImgChange(file)}
          />
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <InputField
            label="Name"
            value={data.name}
            onChange={(e) => setData("name", e.target.value)}
          />

          <InputField
            label="Description"
            value={data.desc}
            onChange={(e) => setData("desc", e.target.value)}
          />
        </div>

      </div>
    </Modal>
  )
}