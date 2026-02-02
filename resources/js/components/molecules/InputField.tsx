import { InputHTMLAttributes } from "react"
import Input from "@/components/atoms/Input"
import Label from "@/components/atoms/Label"

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export default function InputField({
  label,
  id,
  name,
  error,
  className,
  ...props
}: InputFieldProps) {
  const inputId = id ?? name

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={inputId}>{label}</Label>

      <Input
        id={inputId}
        name={name}
        className={`
          ${error ? "border-red-500" : ""}
          ${className ?? ""}
        `}
        {...props}
      />

      {error && (
        <span className="text-xs text-red-500">
          {error}
        </span>
      )}
    </div>
  )
}
