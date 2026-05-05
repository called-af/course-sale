import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';

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

function normalizeFromServer(q: any): QuizQuestion {
    return {
        id: q.id,
        _key: makeKey(),
        question: q.question ?? '',
        type: q.type ?? 'multiple_choice',
        image: q.image ? `/storage/${q.image}` : null, 
        imageFile: null,
        sort_order: q.sort_order,
        quiz_options: q.quiz_options ?? [],
    };
}

export function useQuiz(courseSlug: string, moduleId: number, materialId: number, contentId: number, initialQuestions: any[] = []) {
    const [questions, setQuestions] = useState<QuizQuestion[]>(() =>
        initialQuestions.length > 0 ? initialQuestions.map(normalizeFromServer) : [makeEmptyQuestion(0)],
    );

    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<QuizQuestion | null>(null);

    const baseUrl = `/admin/courses/${courseSlug}/modules/${moduleId}/materials/${materialId}/contents/${contentId}/quiz-questions`;

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

        const hasExisting = questions.some((q) => q.id !== undefined);
        const hasFiles = questions.some((q) => q.imageFile instanceof File);

        const payload: Record<string, any> = {
            material_content_id: contentId,
        };

        questions.forEach((q, i) => {
            if (q.id) payload[`questions[${i}][id]`] = q.id;
            payload[`questions[${i}][question]`] = q.question;
            payload[`questions[${i}][type]`] = q.type;
            payload[`questions[${i}][sort_order]`] = i + 1;
            if (q.imageFile) payload[`questions[${i}][image]`] = q.imageFile;

            if (q.type === 'multiple_choice') {
                q.quiz_options.forEach((o, j) => {
                    if (o.id) payload[`questions[${i}][options][${j}][id]`] = o.id;
                    payload[`questions[${i}][options][${j}][option_text]`] = o.option_text;
                    payload[`questions[${i}][options][${j}][is_correct]`] = o.is_correct ? 1 : 0;
                });
            }
        });

        const routerOptions = {
            forceFormData: hasFiles,
            preserveState: true,
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => router.reload({ only: ['quizQuestions'] }),
            onError: (errs: any) => {
                const messages = Object.values(errs as Record<string, string>).join(', ');
                setErrors(messages || 'Gagal menyimpan soal quiz.');
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
            onError: () => setErrors('Gagal menghapus soal.'),
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
