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

      <div className="relative z-10 w-full max-w-lg bg-white border border-gray-200 shadow-lg dark:bg-[#1e1f24] dark:border-slate-700">
        {title && (
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="px-4 py-3 text-sm text-gray-700 dark:text-slate-200">
          {children}
        </div>

        {footer && (
          <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-slate-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
