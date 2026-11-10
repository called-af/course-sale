import type { PageProps } from '@inertiajs/core';
import type { User } from './user';

export interface NotificationCourse {
    id: number;
    title: string;
    slug: string;
    creator?: {
        name: string;
    };
}

export interface NotificationPayload {
    count: number;
    courses: NotificationCourse[];
}

export interface SharedPageProps extends PageProps {
    auth: {
        user: User;
    };
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
    errors?: Record<string, string>;
    adminReviewNotifications?: NotificationPayload;
    instructorApprovalNotifications?: NotificationPayload;
}
