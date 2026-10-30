export type ChatRole = 'user' | 'assistant';

export interface ChatMessageData {
    id?: number | string;
    role: ChatRole;
    content: string;
    created_at?: string;
}

export interface ChatSessionData {
    id: number | string;
    title: string;
    updated_at?: string;
}

export interface CourseSummary {
    id: number | string;
    title: string;
    slug?: string;
    type?: 'free' | 'paid';
    price?: number | string | null;
    level?: string | null;
    rating?: number | null;
    rating_count?: number | null;
    score?: number | null;
    reason?: string | null;
    thumbnail_url?: string | null;
    description?: string | null;
    creator?: { name?: string } | null;
}

export interface ComparisonCourse {
    id: number | string;
    title: string;
    type?: 'free' | 'paid';
    price?: number | string | null;
    level?: string | null;
    rating?: number | null;
    rating_count?: number | null;
    modules_count?: number | null;
    categories?: string[];
}

export interface LearningPathStep {
    order?: number;
    course_id?: number | string;
    title: string;
    level?: string | null;
}

export interface StructuredChatContent {
    content?: string;
    recommendations?: CourseSummary[];
    courses?: CourseSummary[];
    comparison?: ComparisonCourse[];
    learning_path?: LearningPathStep[];
}
