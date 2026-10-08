import clsx from "clsx"
import type { ButtonHTMLAttributes } from "react"

interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    label?: string
}

export default function Toggle({
    checked,
    onCheckedChange,
    label,
    disabled = false,
    className,
    onClick,
    ...props
}: ToggleProps) {
    return (
        <button
            {...props}
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={(e) => {
                onClick?.(e)
                if (!e.defaultPrevented) onCheckedChange(!checked)
            }}
            className={clsx(
                "relative h-7 w-14 shrink-0 cursor-pointer transition-colors duration-200 motion-reduce:transition-none",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900",
                "disabled:cursor-not-allowed disabled:opacity-50",
                checked ? "bg-purple-600" : "bg-neutral-300 dark:bg-slate-600",
                className,
            )}
        >
            <span
                aria-hidden="true"
                className={clsx(
                    "pointer-events-none absolute top-0.5 left-0.5 h-6 w-6 bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none",
                    checked ? "translate-x-7" : "translate-x-0",
                )}
            />
        </button>
    )
}