import type { Course } from './course';
import type { User } from './user';

export interface EnrolledStudent {
    id: number;
    user_id: number;
    name: string;
    email: string;
    avatar_url?: string | null;
    status: 'active' | 'revoked' | 'expired' | string;
    enrolled_at: string;
    progress_percent: number;
    completed_contents?: number;
    total_contents?: number;
}

export interface EnrolledStudentsSummary {
    total: number;
    completed: number;
    in_progress: number;
    not_started: number;
}

export interface Enrollment {
    id: number;
    user_id: number;
    course_id: number;
    status: 'active' | 'revoked' | 'expired';
    enrolled_at: string;
    created_at?: string;
    updated_at?: string;

    course?: Course;
    user?: User;
}

export interface MaterialProgress {
    id: number;
    user_id: number;
    material_id: number;
    is_completed: boolean;
    completed_at: string | null;
}

export interface RefundPolicy {
    applies: boolean;
    window_days: number;
    max_progress_percent: number;
    enrolled_at?: string | null;
    deadline?: string | null;
    days_left?: number | null;
    progress_percent: number;
    expired: boolean;
    over_progress: boolean;
    eligible: boolean;
}
