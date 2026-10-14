import Textarea from "@/components/atoms/Textarea"
import Label from "@/components/atoms/Label"

interface TextAreaFieldProps {
  label?: string
  error?: string
  className?: string
  [key: string]: any
}

export default function TextAreaField({
  label,
  error,
  className,
  ...props
}: TextAreaFieldProps) {
  return (
    <div className="space-y-1">
      {label && <Label>{label}</Label>}

      <Textarea
        {...props}
        className={`w-full ${className ?? ""}`}
      />

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
