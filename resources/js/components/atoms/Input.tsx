import { InputHTMLAttributes } from "react"

type InputProps = InputHTMLAttributes<HTMLInputElement>

export default function Input({ className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`
        border px-3 py-2 text-sm outline-none
        border-gray-300 focus:border-purple-400 focus:ring-1 focus:ring-purple-400
        ${className ?? ""}
      `}
    />
  )
}
