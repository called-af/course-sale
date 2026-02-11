import clsx from "clsx"

interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "success" | "warning" | "danger" | "info"
  className?: string
}

export default function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "px-2.5 py-1 text-xs rounded-lg font-medium",
        {
          default: "bg-neutral-100 text-neutral-700",
          success: "bg-emerald-50 text-emerald-700",
          warning: "bg-amber-50 text-amber-700",
          danger: "bg-rose-50 text-rose-700",
          info: "bg-sky-50 text-sky-700",
        }[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
