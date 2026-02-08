import { X } from "lucide-react"
import type { ReactNode } from "react"

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg bg-white border border-gray-200 shadow-lg">
        {title && (
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-900"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="px-4 py-3 text-sm text-gray-700">
          {children}
        </div>

        {footer && (
          <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
