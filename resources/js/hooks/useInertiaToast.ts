import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import type { SharedPageProps } from '@/types/shared';

export function useInertiaToast() {
    const { flash, errors } = usePage<SharedPageProps>().props;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }

        // Show first validation error as a toast (for pages without inline error display)
        if (errors && typeof errors === 'object' && !flash?.error) {
            const firstError = Object.values(errors).find((v) => typeof v === 'string');
            if (firstError) {
                toast.error(firstError);
            }
        }
    }, [flash, errors]);
}
