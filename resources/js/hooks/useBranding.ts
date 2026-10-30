import { usePage } from "@inertiajs/react"

interface SharedAppearance {
    name?: string
    contact_email?: string
    domain?: string
}

interface BrandingShape {
    name: string
    contactEmail: string
    domain: string
}

const FALLBACK: BrandingShape = {
    name: "KursusIO",
    contactEmail: "hello@kursusio.com",
    domain: "kursusio.com",
}

/**
 * Brand identity configured by the admin in Settings → General.
 * Falls back to defaults while the shared props are loading.
 */
export function useBranding(): BrandingShape {
    const { appearance, name } = usePage().props as {
        appearance?: SharedAppearance
        name?: string
    }

    return {
        name: appearance?.name || name || FALLBACK.name,
        contactEmail: appearance?.contact_email || FALLBACK.contactEmail,
        domain: appearance?.domain || FALLBACK.domain,
    }
}

export function useAppName(): string {
    return useBranding().name
}
