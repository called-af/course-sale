export interface MaterialContent {
    id: number;
    material_id: number;
    title: string;
    type: 'video' | 'text' | 'quiz' | 'file' | 'ppt';
    content_url?: string | null;
    preview_url?: string | null;
    content_text?: JSON | null;
    duration?: number | null;
    quiz_questions?: Array<{
        id: number;
        question: string;
        image?: string | null;
        type: string;
        quiz_options?: Array<{ id: number; option_text: string; is_correct: boolean }>;
    }>;
    sort_order: number;
    status: 'draft' | 'published';

    created_at?: string;
    updated_at?: string;
}
