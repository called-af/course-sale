import { Link } from '@inertiajs/react';
import React from 'react';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface StatItem {
    icon?: React.ReactNode;
    value: string | number;
    label: string;
}

interface PageHeaderProps {
    /** Breadcrumb items rendered inside the header */
    breadcrumbs?: BreadcrumbItem[];
    /** Left side: optional avatar/icon block */
    leading?: React.ReactNode;
    /** Main title */
    title: string;
    /** Subtitle/description below title */
    description?: string;
    /** Optional inline badge/tag next to title */
    titleBadge?: React.ReactNode;
    /** Stat cards shown on the right */
    stats?: StatItem[];
    /** Action buttons shown on the right (replaces stats if both given, stats take priority row) */
    actions?: React.ReactNode;
}

export default function PageHeader({ breadcrumbs, leading, title, description, titleBadge, stats, actions }: PageHeaderProps) {
    return (
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 text-white shadow-xl shadow-slate-900/5 sm:p-8">
            {/* Background blobs */}
            <div className="pointer-events-none absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -top-10 right-20 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl" />

            <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
                {/* ── Left side ── */}
                <div className="flex min-w-0 flex-1 items-center gap-4">
                    {/* Optional leading block (avatar, icon, etc.) */}
                    {leading && <div className="shrink-0">{leading}</div>}

                    <div className="min-w-0 flex-1 space-y-3">
                        {/* Breadcrumb */}
                        {breadcrumbs && breadcrumbs.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                {breadcrumbs.map((item, i) => {
                                    const isLast = i === breadcrumbs.length - 1;
                                    return (
                                        <React.Fragment key={i}>
                                            {i > 0 && <span className="text-slate-500">/</span>}
                                            {!isLast && item.href ? (
                                                <Link href={item.href} className="font-medium text-slate-300 transition-colors hover:text-white">
                                                    {item.label}
                                                </Link>
                                            ) : (
                                                <span className={isLast ? 'font-medium text-purple-200' : 'font-medium text-slate-300'}>
                                                    {item.label}
                                                </span>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        )}

                        {/* Title row */}
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight break-words text-white sm:text-3xl">{title}</h1>
                            {titleBadge && titleBadge}
                        </div>

                        {/* Description */}
                        {description && <p className="text-sm text-slate-300">{description}</p>}
                    </div>
                </div>

                {/* ── Right side: stats OR actions ── */}
                {(stats || actions) && (
                    <div className="flex w-full shrink-0 flex-wrap items-center gap-4 sm:gap-6 md:w-auto md:justify-end">
                        {stats && stats.length > 0 ? (
                            <>
                                {stats.map((stat, i) => (
                                    <React.Fragment key={i}>
                                        {i > 0 && <div className="h-10 w-px bg-white/10" />}
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-white">
                                                {stat.icon && <span className="text-purple-300">{stat.icon}</span>}
                                                {stat.value}
                                            </div>
                                            <div className="mt-0.5 text-xs text-slate-400">{stat.label}</div>
                                        </div>
                                    </React.Fragment>
                                ))}
                                {actions && (
                                    <>
                                        <div className="h-10 w-px bg-white/10" />
                                        <div>{actions}</div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="w-full md:w-auto">{actions}</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
