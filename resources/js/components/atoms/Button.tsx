import { ButtonHTMLAttributes, ReactNode } from "react"
import clsx from "clsx"

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  widthFull?: boolean
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export default function Button({
  children,
  widthFull = false,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(
        // Base
        "relative inline-flex items-center justify-center gap-2 font-semibold",
        "rounded-lg transition-all duration-200 ease-out",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "active:scale-[0.97]",
        "select-none cursor-pointer",

        // Width
        widthFull ? "w-full" : "",

        // Sizes
        {
          "text-xs px-3 py-1.5 gap-1.5 rounded-md": size === "sm",
          "text-sm px-4 py-2.5":                      size === "md",
          "text-base px-6 py-3":                       size === "lg",
        },

        // Variants
        {
          // Primary — gradient purple with glow
          "bg-gradient-to-b from-purple-500 to-purple-700 text-white shadow-md shadow-purple-500/25 hover:from-purple-400 hover:to-purple-600 hover:shadow-lg hover:shadow-purple-500/30 focus-visible:ring-purple-500":
            variant === "primary",

          // Secondary — slate with subtle depth
          "bg-gradient-to-b from-slate-600 to-slate-700 text-white shadow-md shadow-slate-500/20 hover:from-slate-500 hover:to-slate-600 hover:shadow-lg hover:shadow-slate-500/25 focus-visible:ring-slate-500":
            variant === "secondary",

          // Outline — glass-like border
          "border border-neutral-200/80 bg-white/80 text-neutral-700 shadow-sm backdrop-blur-sm hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 hover:shadow focus-visible:ring-neutral-400":
            variant === "outline",

          // Danger — bold red
          "bg-gradient-to-b from-red-500 to-red-700 text-white shadow-md shadow-red-500/25 hover:from-red-400 hover:to-red-600 hover:shadow-lg hover:shadow-red-500/30 focus-visible:ring-red-500":
            variant === "danger",

          // Ghost — transparent with hover surface
          "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-neutral-400":
            variant === "ghost",
        },

        // Disabled / Loading
        {
          "!opacity-50 !cursor-not-allowed !shadow-none !active:scale-100 pointer-events-none":
            disabled || isLoading,
        },

        className
      )}
      {...props}
    >
      {/* loading spinner overlay */}
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </span>
      )}

      {/* content — invisible when loading so spinner is centered */}
      <span
        className={clsx(
          "inline-flex items-center gap-2 transition-opacity",
          isLoading && "opacity-0"
        )}
      >
        {leftIcon && <span className="flex items-center shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="flex items-center shrink-0">{rightIcon}</span>}
      </span>
    </button>
  )
}