import { Link } from "@inertiajs/react"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface Props {
  items: BreadcrumbItem[]
}

export default function BreadCrumb({ items }: Props) {
  return (
    <nav className="flex items-center text-sm text-neutral-500">
      {items.map((item, index) => {
        const last = index === items.length - 1

        return (
          <span key={index} className="flex items-center">
            {!last && item.href ? (
              <Link
                href={item.href}
                className="hover:text-neutral-900 transition"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-neutral-900 font-medium">
                {item.label}
              </span>
            )}

            {!last && (
              <span className="mx-2 text-neutral-400">
                /
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}