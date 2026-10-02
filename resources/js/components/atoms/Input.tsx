import { InputHTMLAttributes } from "react"

type InputProps = InputHTMLAttributes<HTMLInputElement>

export default function Input({ className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`
        border px-3 py-2 text-sm outline-none
        border-gray-300 focus:border-purple-700 focus:ring-1 focus:ring-purple-700
        bg-white text-slate-900 placeholder-slate-400
        dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:placeholder-slate-500
        dark:focus:border-purple-500 dark:focus:ring-purple-500
        ${className ?? ""}
      `}
    />
  )
}
