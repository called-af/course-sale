import { TextareaHTMLAttributes } from "react"

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export default function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={`
        border px-3 py-2 text-sm outline-none resize-y
        border-gray-300 focus:border-purple-700 focus:ring-1 focus:ring-purple-700
        ${className ?? ""}
      `}
    />
  )
}