import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Clock, HelpCircle, ListChecks, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/components/atoms/Button';
import PreviewQuizQuestion from '@/components/molecules/course-preview/PreviewQuizQuestion';

interface QuizOption {
    id: number;
    option_text: string;
    is_correct: boolean;
}

export interface QuizQuestion {
    id: number;
    question: string;
    image?: string | null;
    type: string;
    quiz_options?: QuizOption[];
}

export interface QuizState {
    status: 'none' | 'in_progress' | 'completed' | 'pending_review';
    attempt_id?: number | null;
    answers?: Record<number, number | string>;
    answered?: number;
    total_questions?: number;
    total?: number;
    correct?: number | null;
    score?: number | null;
    needs_review?: boolean;
}

interface QuizResult {
    score: number;
    correct: number;
    total: number;
    total_questions: number;
    state?: QuizState;
    details?: {
        question_id: number;
        type: string;
        selected_option_id?: number | null;
        correct_option_id?: number | null;
        is_correct?: boolean | null;
    }[];
}

interface CourseQuizRunnerProps {
    title: string;
    duration?: number | null;
    quizQuestions?: QuizQuestion[];
    courseSlug?: string;
    contentId?: number;
    initialState?: QuizState | null;
    onContentCompleted?: () => void;
    onStateChange?: (state: QuizState) => void;
}

type Phase = 'intro' | 'active' | 'result';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function getCsrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

async function postJson<T = unknown>(url: string, body: Record<string, unknown>, keepalive = false): Promise<T> {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify(body),
        keepalive,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data?.message || 'Something went wrong. Please try again.');
    }

    return data as T;
}

function isAnswered(question: QuizQuestion, value: number | string | undefined | null): boolean {
    if (question.type === 'multiple_choice') {
        return value !== undefined && value !== null && value !== '' && !Number.isNaN(Number(value));
    }

    return typeof value === 'string' && value.trim().length > 0;
}

export default function CourseQuizRunner({
    title,
    duration,
    quizQuestions = [],
    courseSlug,
    contentId,
    initialState,
    onContentCompleted,
    onStateChange,
}: CourseQuizRunnerProps) {
    const [phase, setPhase] = useState<Phase>('intro');
    const [answers, setAnswers] = useState<Record<number, number | string>>(() => initialState?.answers ?? {});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<QuizResult | null>(null);
    const [showReview, setShowReview] = useState(false);
    const answersRef = useRef(answers);
    const onStateChangeRef = useRef(onStateChange);
    const skipUnmountSaveRef = useRef(false);
    const submittingRef = useRef(false);
    const phaseRef = useRef<Phase>(phase);

    const baseUrl = courseSlug && contentId ? `/student/courses/${courseSlug}/quiz/${contentId}` : null;
    const baseUrlRef = useRef(baseUrl);

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    useEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    useEffect(() => {
        baseUrlRef.current = baseUrl;
    }, [baseUrl]);

    useEffect(() => {
        onStateChangeRef.current = onStateChange;
    }, [onStateChange]);

    const answeredCount = useMemo(
        () => quizQuestions.filter((question) => isAnswered(question, answers[question.id])).length,
        [quizQuestions, answers],
    );

    const allAnswered = quizQuestions.length > 0 && answeredCount === quizQuestions.length;
    const currentQuestion = quizQuestions[currentIndex];
    const isLastQuestion = currentIndex >= quizQuestions.length - 1;

    const resetLocalState = (nextAnswers: Record<number, number | string> = {}) => {
        setAnswers(nextAnswers);
        setCurrentIndex(0);
        setResult(null);
        setShowReview(false);
        setError(null);
        setSaveStatus('idle');
    };

    const startQuiz = async (mode: 'start' | 'reset' = 'start') => {
        submittingRef.current = false;

        if (!baseUrl) {
            skipUnmountSaveRef.current = false;
            resetLocalState();
            setPhase('active');
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            const data = await postJson<{ state: QuizState }>(`${baseUrl}/${mode}`, {});
            skipUnmountSaveRef.current = false;
            resetLocalState(data.state.answers ?? {});
            onStateChange?.(data.state);
            setPhase('active');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start the quiz.');
        } finally {
            setProcessing(false);
        }
    };

    // Autosave every answer change so the student can leave and continue later.
    useEffect(() => {
        if (phase !== 'active' || !baseUrl || submittingRef.current) return;

        setSaveStatus('saving');
        const timer = window.setTimeout(async () => {
            try {
                const data = await postJson<{ state: QuizState }>(`${baseUrl}/draft`, { answers });
                setSaveStatus('saved');
                onStateChangeRef.current?.(data.state);
            } catch {
                setSaveStatus('error');
            }
        }, 450);

        return () => window.clearTimeout(timer);
    }, [answers, phase, baseUrl]);

    // Best-effort save when the tab is closed or the user navigates away.
    useEffect(() => {
        if (!baseUrl) return;

        const saveOnExit = () => {
            if (phase !== 'active') return;

            fetch(`${baseUrl}/draft`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ answers: answersRef.current }),
                keepalive: true,
            }).catch(() => undefined);
        };

        window.addEventListener('pagehide', saveOnExit);
        document.addEventListener('visibilitychange', saveOnExit);

        return () => {
            window.removeEventListener('pagehide', saveOnExit);
            document.removeEventListener('visibilitychange', saveOnExit);
        };
    }, [phase, baseUrl]);

    // Best-effort save when the component unmounts while an attempt is still open.
    useEffect(() => {
        return () => {
            if (skipUnmountSaveRef.current || phaseRef.current !== 'active') return;

            const url = baseUrlRef.current;
            if (!url) return;

            fetch(`${url}/draft`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ answers: answersRef.current }),
                keepalive: true,
            }).catch(() => undefined);
        };
    }, []);

    const submitQuiz = async () => {
        if (!allAnswered) return;

        if (!baseUrl) {
            const details = quizQuestions.map((question) => {
                const correctOption = question.quiz_options?.find((option) => option.is_correct);
                const selected = answers[question.id];
                const isCorrect =
                    question.type === 'multiple_choice'
                        ? selected !== undefined && correctOption !== undefined && Number(selected) === correctOption.id
                        : null;

                return {
                    question_id: question.id,
                    type: question.type,
                    selected_option_id: typeof selected === 'number' ? selected : null,
                    correct_option_id: correctOption?.id ?? null,
                    is_correct: isCorrect,
                };
            });

            const scoredQuestions = quizQuestions.filter((question) => question.type === 'multiple_choice');
            const correct = details.filter((detail) => detail.is_correct === true).length;

            setResult({
                score: scoredQuestions.length > 0 ? Math.round((correct / scoredQuestions.length) * 100) : 100,
                correct,
                total: scoredQuestions.length,
                total_questions: quizQuestions.length,
                details,
            });
            skipUnmountSaveRef.current = true;
            setPhase('result');
            // Keep the score available when the student leaves and re-opens the quiz.
            onStateChange?.({
                status: 'completed',
                answers,
                answered: quizQuestions.length,
                total_questions: quizQuestions.length,
                total: scoredQuestions.length,
                correct,
                score: scoredQuestions.length > 0 ? Math.round((correct / scoredQuestions.length) * 100) : 100,
            });
            return;
        }

        setProcessing(true);
        setError(null);
        submittingRef.current = true;
        skipUnmountSaveRef.current = true;

        try {
            const data = await postJson<{ data: QuizResult }>(`${baseUrl}/submit`, { answers });
            setResult(data.data);
            setPhase('result');
            setSaveStatus('idle');
            if (data.data.state) onStateChange?.(data.data.state);
            onContentCompleted?.();
        } catch (err) {
            submittingRef.current = false;
            skipUnmountSaveRef.current = false;
            setError(err instanceof Error ? err.message : 'Failed to submit the quiz.');
        } finally {
            setProcessing(false);
        }
    };

    const resetQuiz = async () => {
        await startQuiz('reset');
    };

    const blockCopy = (event: React.ClipboardEvent | React.DragEvent) => {
        event.preventDefault();
    };

    const blockKeys = (event: React.KeyboardEvent) => {
        const key = event.key.toLowerCase();

        if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'x'].includes(key)) {
            event.preventDefault();
        }
    };

    const progressPercent = quizQuestions.length > 0 ? Math.round((answeredCount / quizQuestions.length) * 100) : 0;

    return (
        <div
            className="space-y-4 py-2 select-none"
            onCopy={blockCopy}
            onCut={blockCopy}
            onDragStart={blockCopy}
            onKeyDown={blockKeys}
            style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
        >
            {/* Quiz toolbar */}
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-rose-500" />
                    <span className="text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-200">
                        {title || 'Quiz & Evaluation'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {duration && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Clock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                            {duration}m
                        </span>
                    )}
                    {phase === 'active' && baseUrl && (
                        <span
                            className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-semibold ${
                                saveStatus === 'error'
                                    ? 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400'
                            }`}
                        >
                            <ShieldCheck className="h-3 w-3" />
                            {saveStatus === 'saving'
                                ? 'Saving...'
                                : saveStatus === 'saved'
                                  ? 'Saved'
                                  : saveStatus === 'error'
                                    ? 'Not saved'
                                    : 'Autosave on'}
                        </span>
                    )}
                </div>
            </div>

            {quizQuestions.length === 0 ? (
                <div className="space-y-1 py-8 text-center text-slate-400 dark:text-slate-500">
                    <AlertCircle className="mx-auto h-8 w-8 text-amber-500" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No quiz questions found.</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Add questions inside the material editor.</p>
                </div>
            ) : phase === 'intro' ? (
                <IntroScreen
                    totalQuestions={quizQuestions.length}
                    duration={duration}
                    state={initialState}
                    processing={processing}
                    error={error}
                    autosaveEnabled={Boolean(baseUrl)}
                    onStart={() => startQuiz('start')}
                    onReset={resetQuiz}
                />
            ) : phase === 'active' && currentQuestion ? (
                <div className="space-y-5">
                    {/* Progress */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700 dark:text-slate-200">
                                Question {currentIndex + 1} of {quizQuestions.length}
                            </span>
                            <span className="font-semibold text-purple-600 dark:text-purple-400">
                                {answeredCount}/{quizQuestions.length} answered
                            </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                            <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${progressPercent}%` }} />
                        </div>
                    </div>

                    {/* Question navigator */}
                    <div className="flex flex-wrap gap-1.5">
                        {quizQuestions.map((question, index) => {
                            const answered = isAnswered(question, answers[question.id]);
                            const active = index === currentIndex;

                            return (
                                <button
                                    key={question.id}
                                    type="button"
                                    onClick={() => setCurrentIndex(index)}
                                    title={`Question ${index + 1}${answered ? ' (answered)' : ''}`}
                                    className={`flex h-7 w-7 items-center justify-center text-[11px] font-bold transition-colors ${
                                        active
                                            ? 'bg-purple-600 text-white'
                                            : answered
                                              ? 'border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400'
                                              : 'border border-slate-200 bg-white text-slate-500 hover:border-purple-300 hover:text-purple-600 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-400'
                                    }`}
                                >
                                    {index + 1}
                                </button>
                            );
                        })}
                    </div>

                    {/* Single question */}
                    <div className="border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-700 dark:bg-[#1e1f24]">
                        <PreviewQuizQuestion
                            question={currentQuestion}
                            questionIndex={currentIndex}
                            userAnswer={answers[currentQuestion.id]}
                            showAnswers={false}
                            onSelectOption={(optionId) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }))}
                            onChangeEssay={(text) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: text }))}
                        />
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentIndex === 0 || processing}
                            onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
                            leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
                            className="!rounded-none"
                        >
                            Previous
                        </Button>

                        <div className="flex items-center gap-2">
                            {!isLastQuestion ? (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => setCurrentIndex((index) => Math.min(quizQuestions.length - 1, index + 1))}
                                    rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                                    className="!rounded-none"
                                >
                                    Next
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    isLoading={processing}
                                    disabled={!allAnswered}
                                    onClick={submitQuiz}
                                    leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                                    className="!rounded-none"
                                >
                                    Submit Test
                                </Button>
                            )}
                        </div>
                    </div>

                    {!allAnswered && isLastQuestion && (
                        <p className="text-right text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            Answer every question before submitting ({answeredCount}/{quizQuestions.length} answered).
                        </p>
                    )}
                </div>
            ) : phase === 'result' && result ? (
                <ResultScreen
                    result={result}
                    quizQuestions={quizQuestions}
                    showReview={showReview}
                    onToggleReview={() => setShowReview((value) => !value)}
                    onReset={resetQuiz}
                    processing={processing}
                    error={error}
                />
            ) : null}
        </div>
    );
}

function IntroScreen({
    totalQuestions,
    duration,
    state,
    processing,
    error,
    autosaveEnabled,
    onStart,
    onReset,
}: {
    totalQuestions: number;
    duration?: number | null;
    state?: QuizState | null;
    processing: boolean;
    error: string | null;
    autosaveEnabled: boolean;
    onStart: () => void;
    onReset: () => void;
}) {
    const status = state?.status ?? 'none';
    const answered = state?.answered ?? 0;
    const score = state?.score ?? null;

    return (
        <div className="space-y-5 py-4">
            <div className="mx-auto max-w-xl space-y-4 border border-slate-200 bg-white p-6 text-center sm:p-8 dark:border-slate-700 dark:bg-[#1e1f24]">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-950/40">
                    <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>

                {status === 'completed' ? (
                    <>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quiz completed</h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                You have already submitted this quiz. Reset the test if you want to try again.
                            </p>
                        </div>
                        <div className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-4 py-2 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Score: {Math.round(score ?? 0)}%</span>
                        </div>
                        <Button
                            variant="primary"
                            size="md"
                            isLoading={processing}
                            onClick={onReset}
                            leftIcon={<RotateCcw className="h-4 w-4" />}
                            className="!rounded-none"
                        >
                            Reset Test
                        </Button>
                    </>
                ) : status === 'pending_review' ? (
                    <>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quiz submitted</h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Your answers are in and your progress is saved. The instructor still needs to grade the essay answers.
                            </p>
                        </div>
                        <div className="inline-flex items-center gap-2 border border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-900/50 dark:bg-amber-950/30">
                            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">Awaiting review</span>
                        </div>
                        <Button
                            variant="outline"
                            size="md"
                            isLoading={processing}
                            onClick={onReset}
                            leftIcon={<RotateCcw className="h-4 w-4" />}
                            className="!rounded-none"
                        >
                            Reset Test
                        </Button>
                    </>
                ) : status === 'in_progress' ? (
                    <>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Continue your quiz?</h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                You have an unfinished attempt. Your answers were saved automatically.
                            </p>
                        </div>
                        <div className="inline-flex items-center gap-2 border border-purple-200 bg-purple-50 px-4 py-2 dark:border-purple-900/50 dark:bg-purple-950/30">
                            <ListChecks className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                                {answered}/{state?.total_questions ?? totalQuestions} answered
                            </span>
                        </div>
                        <div className="flex flex-col justify-center gap-2 sm:flex-row">
                            <Button
                                variant="primary"
                                size="md"
                                isLoading={processing}
                                onClick={onStart}
                                leftIcon={<ArrowRight className="h-4 w-4" />}
                                className="!rounded-none"
                            >
                                Continue Quiz
                            </Button>
                            <Button
                                variant="outline"
                                size="md"
                                disabled={processing}
                                onClick={onReset}
                                leftIcon={<RotateCcw className="h-4 w-4" />}
                                className="!rounded-none"
                            >
                                Start Over
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quiz not submitted yet</h3>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                You have not submitted this quiz yet. Start the quiz when you are ready.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1.5 border border-slate-200 px-3 py-1.5 dark:border-slate-700">
                                <ListChecks className="h-3.5 w-3.5 text-purple-500" />
                                {totalQuestions} questions
                            </span>
                            {duration && (
                                <span className="inline-flex items-center gap-1.5 border border-slate-200 px-3 py-1.5 dark:border-slate-700">
                                    <Clock className="h-3.5 w-3.5 text-purple-500" />
                                    {duration} minutes
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 border border-slate-200 px-3 py-1.5 dark:border-slate-700">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                {autosaveEnabled ? 'Autosave' : 'Preview'}
                            </span>
                        </div>
                        <Button
                            variant="primary"
                            size="md"
                            isLoading={processing}
                            onClick={onStart}
                            leftIcon={<ArrowRight className="h-4 w-4" />}
                            className="!rounded-none"
                        >
                            Start Quiz
                        </Button>
                    </>
                )}

                {error && (
                    <div className="flex items-start gap-2 border border-rose-200 bg-rose-50 px-3 py-2 text-left text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

function ResultScreen({
    result,
    quizQuestions,
    showReview,
    onToggleReview,
    onReset,
    processing,
    error,
}: {
    result: QuizResult;
    quizQuestions: QuizQuestion[];
    showReview: boolean;
    onToggleReview: () => void;
    onReset: () => void;
    processing: boolean;
    error: string | null;
}) {
    const roundedScore = Math.round(result.score);

    return (
        <div className="space-y-5 py-4">
            <div className="mx-auto max-w-xl space-y-4 border border-slate-200 bg-white p-6 text-center sm:p-8 dark:border-slate-700 dark:bg-[#1e1f24]">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quiz submitted</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Great job! Here is your result. You can reset the test and try again anytime.
                    </p>
                </div>

                <div className="text-5xl font-black tracking-tight text-purple-600 dark:text-purple-400">{roundedScore}%</div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {result.correct} correct out of {result.total} scored questions
                </p>

                <div className="flex flex-col justify-center gap-2 sm:flex-row">
                    <Button
                        variant="outline"
                        size="md"
                        onClick={onToggleReview}
                        leftIcon={<ListChecks className="h-4 w-4" />}
                        className="!rounded-none"
                    >
                        {showReview ? 'Hide Review' : 'Review Answers'}
                    </Button>
                    <Button
                        variant="primary"
                        size="md"
                        isLoading={processing}
                        onClick={onReset}
                        leftIcon={<RotateCcw className="h-4 w-4" />}
                        className="!rounded-none"
                    >
                        Reset Test
                    </Button>
                </div>

                {error && (
                    <div className="flex items-start gap-2 border border-rose-200 bg-rose-50 px-3 py-2 text-left text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {error}
                    </div>
                )}
            </div>

            {showReview && (
                <div className="mx-auto max-w-xl space-y-2">
                    {quizQuestions.map((question, index) => {
                        const detail = result.details?.find((item) => item.question_id === question.id);

                        return (
                            <div
                                key={question.id}
                                className="flex items-start gap-2 border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-[#1e1f24]"
                            >
                                {detail?.is_correct === true ? (
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                ) : detail?.is_correct === false ? (
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                                ) : (
                                    <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                )}
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                                        Question {index + 1}
                                        {detail?.is_correct === true
                                            ? ' — Correct'
                                            : detail?.is_correct === false
                                              ? ' — Incorrect'
                                              : ' — Essay answer saved'}
                                    </p>
                                    <p className="mt-0.5 line-clamp-2 text-slate-500 dark:text-slate-400">{question.question}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
