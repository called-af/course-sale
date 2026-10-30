import { TextareaHTMLAttributes } from "react"

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export default function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={`
        border px-3 py-2 text-sm outline-none resize-y
        border-gray-300 focus:border-purple-700 focus:ring-1 focus:ring-purple-700
        bg-white text-slate-900 placeholder-slate-400
        dark:bg-[#141416] dark:border-slate-600 dark:text-white dark:placeholder-slate-500
        dark:focus:border-purple-500 dark:focus:ring-purple-500
        ${className ?? ""}
      `}
    />
  )
}
