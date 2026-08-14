import { Link } from "@inertiajs/react"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface Props {
  items: BreadcrumbItem[]
  /** "light" = standalone page (default), "dark" = inside dark header (unused now, handled by PageHeader) */
  variant?: "light" | "dark"
}

export default function BreadCrumb({ items, variant = "light" }: Props) {
  const linkCls =
    variant === "dark"
      ? "text-slate-300 hover:text-white transition-colors font-medium"
      : "text-neutral-500 hover:text-neutral-900 transition-colors"

  const activeCls =
    variant === "dark"
      ? "text-purple-200 font-medium"
      : "text-neutral-900 font-medium"

  const separatorCls =
    variant === "dark" ? "text-slate-500" : "text-neutral-400"

  return (
    <nav className="flex items-center text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <span key={index} className="flex items-center">
            {!isLast && item.href ? (
              <Link href={item.href} className={linkCls}>
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? activeCls : linkCls}>
                {item.label}
              </span>
            )}
            {!isLast && (
              <span className={`mx-2 ${separatorCls}`}>/</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
