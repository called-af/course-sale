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
          border border-neutral-300
          px-3 py-2
          text-sm
          focus:outline-none
          focus:border-black
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
