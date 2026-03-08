import Label from "@/components/atoms/Label"
import Button from "@/components/atoms/Button"

type Option = {
  label: string
  value: number
}

interface MultiSelectFieldProps {
  label: string
  options: Option[]
  value: number[]
  onChange: (values: number[]) => void
}

export default function MultiSelectField({
  label,
  options,
  value,
  onChange,
}: MultiSelectFieldProps) {

  const toggleValue = (optionValue: number) => {

    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue))
      return
    }

    onChange([...value, optionValue])
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>

      <div className="flex flex-wrap gap-2 border border-neutral-300 rounded-lg p-2">

        {options.map(option => {

          const selected = value.includes(option.value)

          return (
            <Button
              key={option.value}
              type="button"
              variant={selected ? "primary" : "outline"}
              onClick={() => toggleValue(option.value)}
              className="py-1 px-3 text-sm"
            >
              {option.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}