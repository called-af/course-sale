import { usePage } from '@inertiajs/react';

import type { SeoMeta } from '@/types/seo';

/**
 * Meta SEO global yang diatur admin pada /admin/settings/seo.
 */
export function useSeo(): SeoMeta {
    return (usePage().props as unknown as { seo: SeoMeta }).seo;
}
