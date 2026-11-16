import { usePage } from '@inertiajs/react';
import { Plus, GripVertical, Trash2, Check, AlertCircle, HelpCircle, FileText } from 'lucide-react';

import Button from '@/components/atoms/Button';
import ChooseFile from '@/components/molecules/ChooseFile';
import ConfirmationDelete from '@/components/molecules/ConfirmationDelete';
import TextAreaField from '@/components/molecules/TextAreaField';

import type { QuizQuestion, QuizOption, ServerQuizQuestion } from '@/hooks/useQuiz';
import { useQuiz } from '@/hooks/useQuiz';

interface Props {
    courseSlug: string;
    moduleId: number;
    materialId: number;
    contentId: number;
    routePrefix: 'admin' | 'instructor';
}

function OptionRow({
    option,
    index,
    canRemove,
    onUpdate,
    onRemove,
    onSetCorrect,
}: {
    option: QuizOption;
    index: number;
    canRemove: boolean;
    onUpdate: (i: number, patch: Partial<QuizOption>) => void;
    onRemove: (i: number) => void;
    onSetCorrect: (i: number) => void;
}) {
    return (
        <div
            className={`group flex cursor-pointer items-center gap-3 border px-3.5 py-2.5 transition-all ${
                option.is_correct
                    ? 'border-emerald-300 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-500/20 dark:border-emerald-800 dark:bg-emerald-950/40'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60 dark:border-slate-700 dark:bg-[#1e1f24] dark:hover:border-slate-600 dark:hover:bg-slate-700'
            }`}
            onClick={() => onSetCorrect(index)}
        >
            <div
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center border-2 transition-all ${
                    option.is_correct
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                        : 'border-slate-300 bg-white group-hover:border-indigo-400 dark:border-slate-600 dark:bg-[#1e1f24]'
                }`}
            >
                {option.is_correct && <Check className="h-3 w-3 stroke-[3]" />}
            </div>

            <span
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center text-xs font-bold ${
                    option.is_correct
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                }`}
            >
                {String.fromCharCode(65 + index)}
            </span>

            <div className="min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
                <input
                    type="text"
                    value={option.option_text}
                    onChange={(e) => onUpdate(index, { option_text: e.target.value })}
                    placeholder={`Option ${String.fromCharCode(65 + index)}...`}
                    className={`w-full border-none bg-transparent text-sm placeholder-slate-300 outline-none ${
                        option.is_correct ? 'font-semibold text-emerald-950 dark:text-emerald-100' : 'text-slate-700 dark:text-slate-200'
                    }`}
                />
            </div>

            {option.is_correct && (
                <span className="hidden flex-shrink-0 bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold text-emerald-600 sm:inline-flex dark:bg-emerald-950/70 dark:text-emerald-300">
                    ✓ Correct Answer
                </span>
            )}

            {canRemove && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(index);
                    }}
                    leftIcon={<Trash2 size={13} />}
                    title="Remove Option"
                    aria-label="Remove Option"
                    className="!h-7 !w-7 flex-shrink-0 !rounded-none !p-0 !text-slate-400 opacity-0 group-hover:opacity-100 hover:!bg-red-50 hover:!text-red-500 dark:!text-slate-500 dark:hover:!bg-red-950/40"
                />
            )}
        </div>
    );
}

function QuestionCard({
    question,
    index,
    onUpdate,
    onConfirmDelete,
    onAddOption,
    onRemoveOption,
    onUpdateOption,
    onSetCorrect,
}: {
    question: QuizQuestion;
    index: number;
    onUpdate: (key: string, patch: Partial<QuizQuestion>) => void;
    onConfirmDelete: (q: QuizQuestion) => void;
    onAddOption: (key: string) => void;
    onRemoveOption: (key: string, i: number) => void;
    onUpdateOption: (key: string, i: number, patch: Partial<QuizOption>) => void;
    onSetCorrect: (key: string, i: number) => void;
}) {
    return (
        <div className="overflow-hidden border border-slate-200/90 bg-white shadow-sm transition-all duration-200 hover:shadow-md dark:border-slate-700 dark:bg-[#1e1f24]">
            {/* Question header */}
            <div className="flex flex-col items-start justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center dark:border-slate-700 dark:bg-[#1e1f24]">
                <div className="flex min-w-0 items-center gap-2.5">
                    <GripVertical size={16} className="shrink-0 cursor-grab text-slate-300 active:cursor-grabbing dark:text-slate-500" />
                    <span className="inline-flex items-center gap-1.5 border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-bold tracking-wider text-indigo-700 uppercase dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300">
                        Question #{String(index + 1).padStart(2, '0')}
                    </span>
                </div>

                <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
                    {/* Tipe Selector Switch */}
                    <div className="flex items-center bg-slate-200/60 p-0.5 dark:bg-slate-700">
                        {(['multiple_choice', 'essay'] as const).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => onUpdate(question._key, { type: t })}
                                className={`px-3 py-1 text-xs font-semibold transition-all ${
                                    question.type === t
                                        ? 'bg-white text-indigo-900 shadow-sm dark:bg-slate-600 dark:text-indigo-100'
                                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                                }`}
                            >
                                {t === 'multiple_choice' ? 'Multiple Choice' : 'Essay'}
                            </button>
                        ))}
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onConfirmDelete(question)}
                        leftIcon={<Trash2 size={15} />}
                        title="Delete Question"
                        aria-label="Delete Question"
                        className="!h-8 !w-8 !rounded-none !p-0 !text-rose-500 hover:!bg-rose-50 dark:hover:!bg-rose-950/40"
                    />
                </div>
            </div>

            <div className="space-y-5 p-5">
                {/* Teks Pertanyaan & Gambar */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_130px]">
                    <TextAreaField
                        label="Question Prompt"
                        name="question"
                        rows={3}
                        value={question.question}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onUpdate(question._key, { question: e.target.value })}
                        placeholder="Write question prompt or instructions here..."
                    />

                    <div className="space-y-1">
                        <ChooseFile
                            label="Question Image"
                            aspect="square"
                            value={question.image ?? null}
                            onChange={(file) => onUpdate(question._key, { imageFile: file })}
                        />
                    </div>
                </div>

                {/* Multiple choice */}
                {question.type === 'multiple_choice' && (
                    <div className="space-y-3 border-t border-slate-100 pt-2 dark:border-slate-700">
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                Answer Options (Click row to select the correct answer)
                            </span>
                            <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{question.quiz_options.length} options</span>
                        </div>

                        <div className="space-y-2">
                            {question.quiz_options.map((opt, i) => (
                                <OptionRow
                                    key={opt.id || i}
                                    option={opt}
                                    index={i}
                                    canRemove={question.quiz_options.length > 2}
                                    onUpdate={(i, patch) => onUpdateOption(question._key, i, patch)}
                                    onRemove={(i) => onRemoveOption(question._key, i)}
                                    onSetCorrect={(i) => onSetCorrect(question._key, i)}
                                />
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            {question.quiz_options.length < 6 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onAddOption(question._key)}
                                    leftIcon={<Plus size={13} />}
                                    className="!rounded-none !border-indigo-100 !bg-indigo-50/50 !text-indigo-600 hover:!bg-indigo-100/50 hover:!text-indigo-800 dark:!border-indigo-900 dark:!bg-indigo-950/40 dark:!text-indigo-300 dark:hover:!bg-indigo-950/70"
                                >
                                    Add Option
                                </Button>
                            )}

                            {!question.quiz_options.some((o) => o.is_correct) && (
                                <div className="inline-flex items-center gap-1.5 border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                                    <AlertCircle size={13} className="text-amber-500" />
                                    No correct answer selected yet.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Essay Info */}
                {question.type === 'essay' && (
                    <div className="space-y-2 border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 dark:text-blue-200">
                            <FileText size={15} className="text-blue-500" />
                            Essay Question
                        </div>
                        <p className="text-xs leading-relaxed text-blue-600 dark:text-blue-300">
                            Students answer freely using a text box. Essay responses are manually reviewed and graded by the instructor.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function QuizBuilder({ courseSlug, moduleId, materialId, contentId, routePrefix }: Props) {
    const { props } = usePage<{ quizQuestions?: ServerQuizQuestion[] }>();

    const quiz = useQuiz(courseSlug, moduleId, materialId, contentId, routePrefix, props.quizQuestions ?? []);

    const mcCount = quiz.questions.filter((q) => q.type === 'multiple_choice').length;
    const essayCount = quiz.questions.filter((q) => q.type === 'essay').length;

    return (
        <div className="space-y-5">
            {/* Question bank header */}
            <div className="flex flex-col justify-between gap-4 border border-slate-200/80 bg-slate-50 p-4 sm:flex-row sm:items-center dark:border-slate-700 dark:bg-[#1e1f24]">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-rose-100 font-bold text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
                        <HelpCircle size={20} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Quiz Question Bank</h3>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                            <span>
                                Total: <strong className="text-slate-800 dark:text-slate-100">{quiz.questions.length} Questions</strong>
                            </span>
                            <span>•</span>
                            <span>
                                Multiple Choice: <strong className="text-indigo-600 dark:text-indigo-300">{mcCount}</strong>
                            </span>
                            <span>•</span>
                            <span>
                                Essay: <strong className="text-purple-600 dark:text-purple-300">{essayCount}</strong>
                            </span>
                        </div>
                    </div>
                </div>

                <Button type="button" size="sm" onClick={quiz.addQuestion} leftIcon={<Plus size={14} />} className="w-full !rounded-none sm:w-auto">
                    Add New Question
                </Button>
            </div>

            {quiz.errors && (
                <div className="flex items-center gap-2 border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                    <AlertCircle size={16} className="shrink-0 text-red-500" />
                    <span>{quiz.errors}</span>
                </div>
            )}

            {/* Question list */}
            <div className="space-y-4">
                {quiz.questions.map((q, i) => (
                    <QuestionCard
                        key={q._key}
                        question={q}
                        index={i}
                        onUpdate={quiz.updateQuestion}
                        onConfirmDelete={quiz.confirmDelete}
                        onAddOption={quiz.addOption}
                        onRemoveOption={quiz.removeOption}
                        onUpdateOption={quiz.updateOption}
                        onSetCorrect={quiz.setCorrectOption}
                    />
                ))}
            </div>

            {/* Action Bar */}
            <div className="flex flex-col justify-between gap-4 border border-slate-200/80 bg-white p-4 shadow-xs sm:flex-row sm:items-center dark:border-slate-700 dark:bg-[#1e1f24]">
                <Button onClick={quiz.save} disabled={quiz.processing} size="md" className="w-full !rounded-none sm:w-auto">
                    {quiz.processing ? 'Saving Questions...' : 'Save All Quiz Questions'}
                </Button>
                <span className="text-xs text-slate-400 dark:text-slate-500">Question changes must be saved manually.</span>
            </div>

            <ConfirmationDelete
                open={!!quiz.deleteTarget}
                onClose={quiz.cancelDelete}
                onConfirm={quiz.executeDelete}
                isLoading={quiz.processing}
                title="Delete Quiz Question"
                message={`Are you sure you want to delete question "${quiz.deleteTarget?.question || 'this'}"? This action cannot be undone.`}
            />
        </div>
    );
}
