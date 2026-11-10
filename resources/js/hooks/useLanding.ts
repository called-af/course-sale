import { usePage } from '@inertiajs/react';

import type { LandingSettings } from '@/types';

/**
 * Landing copy shared from the server (see HandleInertiaRequests).
 * Admins edit it under /admin/settings/landing/{section}.
 */
export function useLanding(): LandingSettings {
    return (usePage().props as unknown as { landing: LandingSettings }).landing;
}
