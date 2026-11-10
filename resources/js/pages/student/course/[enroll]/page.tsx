import type { ReactNode } from 'react';
import type { QuizState } from '@/components/organisms/Course/CourseQuizRunner';
import CourseLearningTemplate, { CourseLearningLayout } from '@/components/templates/CourseLearningTemplate';
import type { Course, CourseResource, Material, MaterialContent, RefundPolicy } from '@/types';

interface LearningPageProps {
    course: Course;
    progress: Record<number, boolean>;
    contentProgress?: Record<number, boolean>;
    quizStates?: Record<number, QuizState>;
    certificate?: { id: number; certificate_number: string } | null;
    currentMaterial?: Material | null;
    currentContent?: MaterialContent | null;
    resume?: { material_id: number; content_id?: number | null } | null;
    resources?: CourseResource[];
    resourcesUnlocked?: boolean;
    refundPolicy?: RefundPolicy | null;
}

export default function LearningPage(props: LearningPageProps) {
    return <CourseLearningTemplate {...props} mode="learning" />;
}

LearningPage.layout = (page: ReactNode) => <CourseLearningLayout>{page}</CourseLearningLayout>;
