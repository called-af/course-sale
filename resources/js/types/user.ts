export type User = {
    id: number;
    name: string;
    email: string;
    role: 'student' | 'instructor' | 'admin';
    bio?: string | null;
    avatar_url?: string | null;

    // Counts (from withCount)
    created_courses_count?: number;
    enrollments_count?: number;

    // Relations (from load) — Laravel serializes as snake_case
    created_courses?: UserCourse[];
    enrollments?: UserEnrollment[];
};

export type UserCourse = {
    id: number;
    title: string;
    slug: string;
    type: 'free' | 'paid';
    price: number | null;
    level: string | null;
    status: string;
    thumbnail_url: string | null;
    rating_avg: number | null;
    rating_count: number;
    published_at: string | null;
    created_at: string;

    // Counts (from withCount)
    modules_count?: number;
    enrollments_count?: number;

    categories?: {
        id: number;
        name: string;
    }[];
};

export type UserEnrollment = {
    id: number;
    course_id: number;
    status: 'active' | 'revoked' | 'expired';
    enrolled_at: string;
    course?: {
        id: number;
        title: string;
        slug: string;
        thumbnail_url: string | null;
    };
};
