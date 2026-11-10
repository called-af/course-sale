import { router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export type QuestionType = 'multiple_choice' | 'essay';

export interface QuizOption {
    id?: number;
    option_text: string;
    is_correct: boolean;
}

export interface QuizQuestion {
    id?: number;
    _key: string;
    question: string;
    type: QuestionType;
    image?: string | null;
    imageFile?: File | null;
    sort_order?: number;
    quiz_options: QuizOption[];
}

export interface ServerQuizOption {
    id?: number;
    option_text?: string | null;
    is_correct?: boolean | number;
}

export interface ServerQuizQuestion {
    id?: number;
    _key?: string;
    question?: string | null;
    type?: QuestionType;
    image?: string | null;
    sort_order?: number;
    quiz_options?: ServerQuizOption[];
}

type QuizPayloadValue = string | number | File | undefined | QuizPayloadValue[] | { [key: string]: QuizPayloadValue };

function makeKey() {
    return Math.random().toString(36).slice(2);
}

function makeEmptyQuestion(index: number): QuizQuestion {
    return {
        _key: makeKey(),
        question: '',
        type: 'multiple_choice',
        image: null,
        imageFile: null,
        sort_order: index + 1,
        quiz_options: [
            { option_text: '', is_correct: false },
            { option_text: '', is_correct: false },
        ],
    };
}

function normalizeFromServer(q: ServerQuizQuestion): QuizQuestion {
    return {
        id: q.id,
        _key: q._key || makeKey(),
        question: q.question ?? '',
        type: q.type ?? 'multiple_choice',
        image: q.image ? (q.image.startsWith('/') || q.image.startsWith('http') ? q.image : `/storage/${q.image}`) : null,
        imageFile: null,
        sort_order: q.sort_order,
        quiz_options: (q.quiz_options ?? []).map((opt) => ({
            id: opt.id,
            option_text: opt.option_text ?? '',
            is_correct: Boolean(opt.is_correct),
        })),
    };
}

export function useQuiz(
    courseSlug: string,
    moduleId: number,
    materialId: number,
    contentId: number,
    routePrefix: 'admin' | 'instructor',
    initialQuestions: ServerQuizQuestion[] = [],
) {
    const [questions, setQuestions] = useState<QuizQuestion[]>(() =>
        initialQuestions.length > 0 ? initialQuestions.map(normalizeFromServer) : [makeEmptyQuestion(0)],
    );

    useEffect(() => {
        if (initialQuestions.length > 0) {
            setQuestions(initialQuestions.map(normalizeFromServer));
        }
    }, [initialQuestions]);

    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<QuizQuestion | null>(null);

    const baseUrl = `/${routePrefix}/courses/${courseSlug}/modules/${moduleId}/materials/${materialId}/contents/${contentId}/quiz-questions`;

    const addQuestion = () => setQuestions((prev) => [...prev, makeEmptyQuestion(prev.length)]);

    const removeLocal = (key: string) => setQuestions((prev) => prev.filter((q) => q._key !== key));

    const updateQuestion = (key: string, patch: Partial<QuizQuestion>) => {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q._key !== key) return q;
                const updated = { ...q, ...patch };
                if (patch.type === 'essay') {
                    updated.quiz_options = [];
                }
                if (patch.type === 'multiple_choice' && updated.quiz_options.length === 0) {
                    updated.quiz_options = [
                        { option_text: '', is_correct: false },
                        { option_text: '', is_correct: false },
                    ];
                }
                return updated;
            }),
        );
    };

    const addOption = (questionKey: string) =>
        setQuestions((prev) =>
            prev.map((q) => (q._key === questionKey ? { ...q, quiz_options: [...q.quiz_options, { option_text: '', is_correct: false }] } : q)),
        );

    const removeOption = (questionKey: string, optionIndex: number) =>
        setQuestions((prev) =>
            prev.map((q) => (q._key === questionKey ? { ...q, quiz_options: q.quiz_options.filter((_, i) => i !== optionIndex) } : q)),
        );

    const updateOption = (questionKey: string, optionIndex: number, patch: Partial<QuizOption>) =>
        setQuestions((prev) =>
            prev.map((q) =>
                q._key === questionKey ? { ...q, quiz_options: q.quiz_options.map((o, i) => (i === optionIndex ? { ...o, ...patch } : o)) } : q,
            ),
        );

    const setCorrectOption = (questionKey: string, optionIndex: number) =>
        setQuestions((prev) =>
            prev.map((q) =>
                q._key === questionKey ? { ...q, quiz_options: q.quiz_options.map((o, i) => ({ ...o, is_correct: i === optionIndex })) } : q,
            ),
        );

    const save = () => {
        setErrors(null);

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.question.trim()) {
                setErrors(`Question ${i + 1} does not have question text.`);
                return;
            }
            if (q.type === 'multiple_choice') {
                if (q.quiz_options.length < 2) {
                    setErrors(`Question ${i + 1} (multiple choice) must have at least 2 options.`);
                    return;
                }
                const hasEmptyText = q.quiz_options.some((o) => !o.option_text.trim());
                if (hasEmptyText) {
                    setErrors(`Question ${i + 1} has an empty answer option.`);
                    return;
                }
                const hasCorrect = q.quiz_options.some((o) => o.is_correct);
                if (!hasCorrect) {
                    setErrors(`Question ${i + 1} does not have a correct answer selected.`);
                    return;
                }
            }
        }

        const hasExisting = questions.some((q) => q.id !== undefined);
        const hasFiles = questions.some((q) => q.imageFile instanceof File);

        const payload: Record<string, QuizPayloadValue> = {
            material_content_id: contentId,
            questions: questions.map((q, i) => ({
                ...(q.id ? { id: q.id } : {}),
                question: q.question,
                type: q.type,
                sort_order: i + 1,
                ...(q.imageFile ? { image: q.imageFile } : {}),
                ...(q.type === 'multiple_choice'
                    ? {
                          options: q.quiz_options.map((o) => ({
                              ...(o.id ? { id: o.id } : {}),
                              option_text: o.option_text,
                              is_correct: o.is_correct ? 1 : 0,
                          })),
                      }
                    : {}),
            })),
        };

        const routerOptions = {
            forceFormData: hasFiles,
            preserveState: true,
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onError: (errs: Record<string, string>) => {
                const messages = Object.values(errs).join(', ');
                setErrors(messages || 'Failed to save quiz questions.');
            },
        };

        if (hasExisting) {
            if (hasFiles) {
                payload['_method'] = 'PUT';
                router.post(baseUrl, payload, routerOptions);
            } else {
                router.put(baseUrl, payload, routerOptions);
            }
        } else {
            router.post(baseUrl, payload, routerOptions);
        }
    };

    const confirmDelete = (q: QuizQuestion) => setDeleteTarget(q);
    const cancelDelete = () => setDeleteTarget(null);

    const executeDelete = () => {
        if (!deleteTarget) return;

        if (!deleteTarget.id) {
            removeLocal(deleteTarget._key);
            setDeleteTarget(null);
            return;
        }

        router.delete(`${baseUrl}/${deleteTarget.id}`, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setQuestions((prev) => prev.filter((q) => q._key !== deleteTarget._key));
                setDeleteTarget(null);
            },
            onError: () => setErrors('Failed to delete question.'),
        });
    };

    return {
        questions,
        processing,
        errors,
        deleteTarget,
        addQuestion,
        updateQuestion,
        addOption,
        removeOption,
        updateOption,
        setCorrectOption,
        save,
        confirmDelete,
        cancelDelete,
        executeDelete,
    };
}
