import { Link, usePage, router } from "@inertiajs/react"
import {
  LayoutDashboard,
  BookOpen,
  Users,
  X,
  ChevronDown,
  LogOut,
  User,
  ExternalLink,
  Globe,
  LayoutTemplate,
  Star,
  MessageSquare,
} from "lucide-react"
import clsx from "clsx"
import { useState } from "react"

interface SidebarProps {
  open: boolean
  onClose: () => void
}

interface MenuItem {
  label: string
  href?: string
  icon: any
  badge?: string
  children?: { label: string; href: string }[]
}

const mainMenus: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Courses",
    icon: BookOpen,
    children: [
      { label: "All Courses", href: "/admin/courses"    },
      { label: "Categories",  href: "/admin/categories" },
      { label: "Tags",        href: "/admin/tags"       },
    ],
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Community",
    icon: MessageSquare,
    children: [
      { label: "Reviews",  href: "/admin/reviews"  },
      { label: "Comments", href: "/admin/comments" },
    ],
  },
]

const systemMenus: MenuItem[] = [
  {
    label: "Web Settings",
    icon: Globe,
    children: [
      { label: "General",  href: "/admin/settings/general"  },
      { label: "SEO",      href: "/admin/settings/seo"      },
      { label: "Social",   href: "/admin/settings/social"   },
    ],
  },
  {
    label: "Landing Page",
    icon: LayoutTemplate,
    children: [
      { label: "Hero",        href: "/admin/settings/landing/hero"        },
      { label: "About",       href: "/admin/settings/landing/about"       },
      { label: "Courses",     href: "/admin/settings/landing/courses"     },
      { label: "Career",      href: "/admin/settings/landing/career"      },
      { label: "Testimonial", href: "/admin/settings/landing/testimonial" },
      { label: "CTA",         href: "/admin/settings/landing/cta"         },
      { label: "Footer",      href: "/admin/settings/landing/footer"      },
    ],
  },
  {
    label: "Profile",
    href: "/admin/profile",
    icon: User,
  },
]

function SideItem({
  item,
  url,
  onClose,
  expanded,
  toggle,
}: {
  item: MenuItem
  url: string
  onClose: () => void
  expanded: string | null
  toggle: (label: string) => void
}) {
  const Icon = item.icon

  if (!item.children) {
    const active = url.startsWith(item.href!)
    return (
      <Link
        href={item.href!}
        onClick={onClose}
        className={clsx(
          "flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150 group relative",
          active ? "text-white" : "text-white/40 hover:text-white/80"
        )}
      >
        {active && (
          <span className="absolute inset-0" style={{ background: "rgba(255,255,255,0.06)" }} />
        )}
        {active && (
          <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-purple-500" />
        )}
        <Icon size={15} className={clsx("shrink-0 transition-colors", active ? "text-purple-400" : "text-white/25 group-hover:text-white/50")} />
        <span className="relative">{item.label}</span>
        {item.badge && (
          <span className="ml-auto text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 font-medium">
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  const isOpen = expanded === item.label
  const groupActive = item.children.some((c) => url.startsWith(c.href))

  return (
    <div>
      <button
        onClick={() => toggle(item.label)}
        className={clsx(
          "w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150 group",
          groupActive ? "text-white/80" : "text-white/40 hover:text-white/70"
        )}
      >
        <Icon size={15} className={clsx("shrink-0 transition-colors", groupActive ? "text-purple-400" : "text-white/25 group-hover:text-white/50")} />
        {item.label}
        <ChevronDown
          size={13}
          className={clsx("ml-auto text-white/20 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>

      <div className={clsx("overflow-hidden transition-all duration-200", isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0")}>
        <div className="ml-6 pl-4 py-1 space-y-0.5" style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
          {item.children.map((child) => {
            const childActive = url.startsWith(child.href)
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onClose}
                className={clsx(
                  "block px-2 py-1.5 text-xs transition-colors",
                  childActive ? "text-purple-400 font-medium" : "text-white/35 hover:text-white/70"
                )}
              >
                {child.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { url, props } = usePage()
  const auth = (props as any).auth

  const allMenus = [...mainMenus, ...systemMenus]

  const [expanded, setExpanded] = useState<string | null>(() => {
    const active = allMenus.find(
      (m) => m.children?.some((c) => url.startsWith(c.href))
    )
    return active?.label ?? null
  })

  const toggle = (label: string) =>
    setExpanded((prev) => (prev === label ? null : label))

  const logout = () => router.post("/logout")

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={onClose} />
      )}

      <aside
        className={clsx(
          "fixed lg:static inset-y-0 left-0 w-64 h-screen z-50 flex flex-col transform transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
        style={{ background: "#0f0f0f" }}
      >
        <div className="h-16 flex items-center justify-between px-5 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <Link href="/" className="flex items-center">
            <img src="/images/logo.png" alt="Logo" className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/" target="_blank" className="p-1.5 text-white/20 hover:text-white/60 transition-colors" title="View site">
              <ExternalLink size={14} />
            </Link>
            <button onClick={onClose} className="lg:hidden p-1.5 text-white/20 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
        <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-5">
          <div>
            <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.15em] px-3 mb-2">Main</p>
            <div className="space-y-0.5">
              {mainMenus.map((item) => (
                <SideItem key={item.label} item={item} url={url} onClose={onClose} expanded={expanded} toggle={toggle} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.15em] px-3 mb-2">System</p>
            <div className="space-y-0.5">
              {systemMenus.map((item) => (
                <SideItem key={item.label} item={item} url={url} onClose={onClose} expanded={expanded} toggle={toggle} />
              ))}
            </div>
          </div>

        </nav>
        <div className="px-3 py-3 shrink-0 bg-zinc-900" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-3 px-2 py-2.5">
            <div className="w-8 h-8 shrink-0 flex items-center justify-center text-xs font-bold text-purple-300" style={{ background: "rgba(139,92,246,0.15)" }}>
              {auth?.user?.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white/80 truncate">{auth?.user?.name}</p>
              <p className="text-[10px] text-white/25 truncate">{auth?.user?.email}</p>
            </div>
            <button onClick={logout} className="p-1.5 text-white/20 hover:text-red-400 transition-colors shrink-0" title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
