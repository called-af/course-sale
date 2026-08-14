import React, { HTMLAttributes } from "react"
import clsx from "clsx"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: "default" | "flat" | "bordered" | "gradient"
  className?: string
}

export default function Card({
  children,
  variant = "default",
  className,
  ...props
}: CardProps) {
  const variantStyles = {
    default: "bg-white border border-slate-200/80 shadow-xs",
    flat: "bg-slate-50 border border-slate-200",
    bordered: "bg-white border-2 border-slate-200",
    gradient: "bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white border border-purple-900/50 shadow-xl",
  }

  return (
    <div
      className={clsx(
        "rounded-2xl p-6 transition-all duration-200",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
