import React from 'react';

interface QuizOption {
    id: number;
    option_text: string;
    is_correct: boolean;
}

interface QuizQuestionData {
    id: number;
    question: string;
    image?: string | null;
    type: string;
    quiz_options?: QuizOption[];
}

interface PreviewQuizQuestionProps {
    question: QuizQuestionData;
    questionIndex: number;
    userAnswer?: number | string;
    showAnswers: boolean;
    onSelectOption: (optionId: number) => void;
    onChangeEssay: (text: string) => void;
}

export default function PreviewQuizQuestion({
    question,
    questionIndex,
    userAnswer,
    showAnswers,
    onSelectOption,
    onChangeEssay,
}: PreviewQuizQuestionProps) {
    return (
        <div className="space-y-3 border-b border-slate-100 py-4 last:border-0 dark:border-slate-700">
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">Question {questionIndex + 1}</span>
            </div>

            <p className="text-sm leading-relaxed font-semibold text-slate-900 dark:text-slate-100">{question.question}</p>

            {question.image && (
                <div className="my-2 max-h-72 overflow-hidden rounded-none border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-[#1e1f24]">
                    <img src={question.image} alt={`Question ${questionIndex + 1}`} className="h-full w-full object-contain" />
                </div>
            )}

            {question.type === 'multiple_choice' ? (
                <div className="space-y-2 pt-1">
                    {question.quiz_options?.map((option, optionIndex) => {
                        const isSelected = userAnswer === option.id;
                        const isCorrect = option.is_correct;

                        let btnStyles = 'bg-slate-50 dark:bg-[#1e1f24] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700';
                        let badgeStyles = 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';

                        if (isSelected) {
                            btnStyles = 'bg-purple-50 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200 font-medium ring-1 ring-purple-500';
                            badgeStyles = 'bg-purple-600 text-white';
                        }

                        if (showAnswers && isCorrect) {
                            btnStyles =
                                'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 font-medium ring-1 ring-emerald-500';
                            badgeStyles = 'bg-emerald-600 text-white';
                        }

                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => onSelectOption(option.id)}
                                className={`flex w-full items-center gap-3 rounded-none px-3.5 py-2.5 text-left text-xs transition-colors ${btnStyles}`}
                            >
                                <div
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-none text-[11px] font-bold ${badgeStyles}`}
                                >
                                    {String.fromCharCode(65 + optionIndex)}
                                </div>
                                <span className="flex-1">{option.option_text}</span>
                                {showAnswers && isCorrect && (
                                    <span className="rounded-none bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                        Correct Answer
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="pt-1">
                    <textarea
                        rows={3}
                        className="w-full rounded-none border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 placeholder-slate-400 transition-colors outline-none select-text focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-200 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-200 dark:placeholder-slate-500 dark:focus:border-purple-500 dark:focus:bg-slate-800 dark:focus:ring-purple-900/50"
                        placeholder="Write your essay answer here for testing..."
                        value={(userAnswer as string) ?? ''}
                        onChange={(e) => onChangeEssay(e.target.value)}
                    />
                </div>
            )}
        </div>
    );
}
