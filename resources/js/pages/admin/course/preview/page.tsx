import type { ReactNode } from 'react';
import type { QuizState } from '@/components/organisms/Course/CourseQuizRunner';
import CourseLearningTemplate, { CourseLearningLayout } from '@/components/templates/CourseLearningTemplate';
import type { Course } from '@/types';

export default function CoursePreview({ course, quizStates }: { course: Course; quizStates?: Record<number, QuizState> }) {
    return <CourseLearningTemplate course={course} quizStates={quizStates} mode="preview" />;
}

CoursePreview.layout = (page: ReactNode) => <CourseLearningLayout>{page}</CourseLearningLayout>;
