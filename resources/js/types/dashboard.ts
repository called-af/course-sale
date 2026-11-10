export interface DashboardUser {
    id: number;
    name: string;
    email?: string;
    role: string;
    avatar_url?: string | null;
}

export interface AiDisplaySettings {
    enabled?: boolean;
    is_configured?: boolean;
    [key: string]: unknown;
}

export interface ContinueLearningMaterial {
    id: number;
    title: string;
    content_id?: number;
    content_title?: string;
    content_type?: string;
}

export interface ContinueLearningCourse {
    id: number;
    title?: string;
    slug?: string;
    thumbnail_url?: string | null;
    level?: string | null;
    type?: string | null;
    price?: number | null;
    rating_avg?: number | null;
    progress_percent?: number;
    completed_materials?: number;
    total_materials?: number;
    next_material?: ContinueLearningMaterial | null;
    creator?: {
        id: number;
        name: string;
    } | null;
    categories?: Array<{
        id: number;
        name: string;
    }>;
    certificate?: {
        id: number;
        certificate_number: string;
    } | null;
    modules?: Array<{
        id: number;
        materials?: Array<{
            id: number;
            contents?: Array<{
                id: number;
            }>;
        }>;
    }>;
}

export interface ContinueLearningEnrollment {
    enrollment?: {
        id: number;
        status: string;
        enrolled_at?: string;
    };
    course: ContinueLearningCourse;
}

export interface StudentOrderItem {
    id: number;
    course_id?: number;
    course_title?: string;
    course_price?: number;
    course?: {
        id?: number;
        title?: string;
        slug?: string;
    } | null;
}

export interface StudentOrder {
    id: number;
    order_number: string;
    total_price?: number;
    status?: string;
    currency?: string;
    created_at?: string | null;
    paid_at?: string | null;
    items?: StudentOrderItem[];
}

export interface CertificateItem {
    id: number;
    certificate_number: string;
    issued_at: string;
    has_pdf?: boolean;
    course: {
        id: number;
        title: string;
        slug: string;
        thumbnail_url?: string;
        instructor: string;
    };
}

export interface WeeklyActivityItem {
    date: string;
    day_name: string;
    count: number;
    is_today?: boolean;
}

export interface RecentActivityItem {
    id: number;
    type: string;
    title: string;
    course_title?: string;
    course_slug?: string;
    time_ago: string;
}

export interface RecommendedCourse {
    id: number;
    title: string;
    slug: string;
    thumbnail_url?: string | null;
    level?: string | null;
    type?: string | null;
    price?: number | null;
    rating_avg?: number | null;
    recommendation_reason?: string | null;
    creator?: {
        name: string;
    } | null;
    tags?: Array<{
        id?: number;
        name: string;
    }>;
}

export interface InstructorCourse {
    id: number;
    title: string;
    slug: string;
    thumbnail_url?: string | null;
    status: string;
    level?: string | null;
    type?: string | null;
    price?: number | null;
    rating_avg?: number | null;
    reviews_count?: number | null;
    enrollments_count?: number | null;
}

export interface RecentEnrollment {
    id: number;
    enrolled_at?: string | null;
    user?: {
        id?: number;
        name?: string;
    } | null;
    course?: {
        id?: number;
        title?: string;
        slug?: string;
    } | null;
}

export interface RecentReview {
    id: number;
    rating: number;
    comment?: string | null;
    created_at?: string | null;
    user?: {
        id?: number;
        name?: string;
    } | null;
    course?: {
        id?: number;
        title?: string;
        slug?: string;
    } | null;
}

export interface CourseStatusCounts {
    published: number;
    review: number;
    draft: number;
}

export interface DashboardBaseProps {
    auth: {
        user: DashboardUser;
    };
    ai?: AiDisplaySettings | null;
}

export interface StudentDashboardProps extends DashboardBaseProps {
    enrolledCourses?: ContinueLearningEnrollment[];
    continueLearningCourse?: ContinueLearningEnrollment | null;
    totalCompleted?: number;
    overallProgress?: number;
    completedMaterials?: number;
    learningMinutes?: number;
    totalCertificates?: number;
    recentCertificates?: CertificateItem[];
    weeklyActivity?: WeeklyActivityItem[];
    averageQuizScore?: number | null;
    quizzesCompleted?: number;
    recentActivities?: RecentActivityItem[];
    recommendedCourses?: RecommendedCourse[];
    orders?: StudentOrder[];
}

export interface InstructorDashboardProps extends DashboardBaseProps {
    instructorCourses?: InstructorCourse[];
    totalStudents?: number;
    totalEarnings?: number;
    averageRating?: number;
    recentEnrollments?: RecentEnrollment[];
    totalReviews?: number;
    totalLessons?: number;
    totalCertificates?: number;
    completionRate?: number;
    statusCounts?: CourseStatusCounts;
    newStudentsThisMonth?: number;
    enrollmentTrend?: WeeklyActivityItem[];
    topCourse?: InstructorCourse | null;
    recentReviews?: RecentReview[];
}
