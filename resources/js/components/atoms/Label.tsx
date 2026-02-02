import { LabelHTMLAttributes } from "react"

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>

export default function Label({ className, ...props }: LabelProps) {
  return (
    <label
      {...props}
      className={`text-sm font-medium ${className ?? ""}`}
    />
  )
}
