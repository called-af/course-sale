import { SelectHTMLAttributes } from "react"
import Label from "@/components/atoms/Label"

type Option = {
  label: string
  value: string
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: Option[]
}

export default function SelectField({
  label,
  id,
  name,
  className,
  options,
  ...props
}: SelectFieldProps) {
  const selectId = id ?? name

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={selectId}>{label}</Label>

      <select
        id={selectId}
        name={name}
        className={`
          border px-3 py-2 text-sm outline-none
          border-gray-300 focus:border-purple-700 focus:ring-1 focus:ring-purple-700
          bg-white text-slate-900
          dark:bg-[#1e1f24] dark:border-slate-600 dark:text-white
          dark:focus:border-purple-500 dark:focus:ring-purple-500
          ${className ?? ""}
        `}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
