import Modal from "@/components/atoms/Modal"
import Button from "@/components/atoms/Button"

interface ConfirmationDeleteProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
  title?: string
  message?: string
}

export default function ConfirmationDelete({
  open,
  onClose,
  onConfirm,
  isLoading = false,
  title = "Delete Confirmation",
  message = "Are you sure you want to delete this item?",
}: ConfirmationDeleteProps) {
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
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            Delete
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-600 dark:text-slate-300">
        {message}
      </p>
    </Modal>
  )
}