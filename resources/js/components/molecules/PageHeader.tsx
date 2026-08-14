import { Link } from "@inertiajs/react"
import React from "react"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface StatItem {
  icon?: React.ReactNode
  value: string | number
  label: string
}

interface PageHeaderProps {
  /** Breadcrumb items rendered inside the header */
  breadcrumbs?: BreadcrumbItem[]
  /** Left side: optional avatar/icon block */
  leading?: React.ReactNode
  /** Main title */
  title: string
  /** Subtitle/description below title */
  description?: string
  /** Optional inline badge/tag next to title */
  titleBadge?: React.ReactNode
  /** Stat cards shown on the right */
  stats?: StatItem[]
  /** Action buttons shown on the right (replaces stats if both given, stats take priority row) */
  actions?: React.ReactNode
}

export default function PageHeader({
  breadcrumbs,
  leading,
  title,
  description,
  titleBadge,
  stats,
  actions,
}: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-slate-900/5">
      {/* Background blobs */}
      <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-20 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">

        {/* ── Left side ── */}
        <div className="flex items-center gap-4">
          {/* Optional leading block (avatar, icon, etc.) */}
          {leading && (
            <div className="shrink-0">{leading}</div>
          )}

          <div className="space-y-3">
            {/* Breadcrumb */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {breadcrumbs.map((item, i) => {
                  const isLast = i === breadcrumbs.length - 1
                  return (
                    <React.Fragment key={i}>
                      {i > 0 && (
                        <span className="text-slate-500">/</span>
                      )}
                      {!isLast && item.href ? (
                        <Link
                          href={item.href}
                          className="text-slate-300 hover:text-white transition-colors font-medium"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span className={isLast ? "text-purple-200 font-medium" : "text-slate-300 font-medium"}>
                          {item.label}
                        </span>
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            )}

            {/* Title row */}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {title}
              </h1>
              {titleBadge && titleBadge}
            </div>

            {/* Description */}
            {description && (
              <p className="text-sm text-slate-300">{description}</p>
            )}
          </div>
        </div>

        {/* ── Right side: stats OR actions ── */}
        {(stats || actions) && (
          <div className="shrink-0 flex items-center gap-6">
            {stats && stats.length > 0 ? (
              <>
                {stats.map((stat, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <div className="w-px h-10 bg-white/10" />}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-white">
                        {stat.icon && (
                          <span className="text-purple-300">{stat.icon}</span>
                        )}
                        {stat.value}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
                    </div>
                  </React.Fragment>
                ))}
                {actions && (
                  <>
                    <div className="w-px h-10 bg-white/10" />
                    <div>{actions}</div>
                  </>
                )}
              </>
            ) : (
              <div>{actions}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
