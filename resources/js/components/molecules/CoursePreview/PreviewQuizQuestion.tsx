import React from "react"

interface QuizOption {
  id: number
  option_text: string
  is_correct: boolean
}

interface QuizQuestionData {
  id: number
  question: string
  image?: string | null
  type: string
  quiz_options?: QuizOption[]
}

interface PreviewQuizQuestionProps {
  question: QuizQuestionData
  questionIndex: number
  userAnswer?: number | string
  showAnswers: boolean
  onSelectOption: (optionId: number) => void
  onChangeEssay: (text: string) => void
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
    <div className="py-4 border-b border-slate-100 last:border-0 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Question {questionIndex + 1}
        </span>
      </div>

      <p className="text-sm font-semibold text-slate-900 leading-relaxed">
        {question.question}
      </p>

      {question.image && (
        <div className="overflow-hidden rounded-none border border-slate-200 max-h-72 bg-slate-50 my-2">
          <img
            src={question.image}
            alt={`Question ${questionIndex + 1}`}
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {question.type === "multiple_choice" ? (
        <div className="space-y-2 pt-1">
          {question.quiz_options?.map((option, optionIndex) => {
            const isSelected = userAnswer === option.id
            const isCorrect = option.is_correct

            let btnStyles = "bg-slate-50 text-slate-700 hover:bg-slate-100"
            let badgeStyles = "bg-slate-200 text-slate-600"

            if (isSelected) {
              btnStyles = "bg-purple-50 text-purple-950 font-medium ring-1 ring-purple-500"
              badgeStyles = "bg-purple-600 text-white"
            }

            if (showAnswers && isCorrect) {
              btnStyles = "bg-emerald-50 text-emerald-950 font-medium ring-1 ring-emerald-500"
              badgeStyles = "bg-emerald-600 text-white"
            }

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelectOption(option.id)}
                className={`w-full rounded-none px-3.5 py-2.5 text-left text-xs transition-colors flex items-center gap-3 ${btnStyles}`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-none text-[11px] font-bold ${badgeStyles}`}
                >
                  {String.fromCharCode(65 + optionIndex)}
                </div>
                <span className="flex-1">{option.option_text}</span>
                {showAnswers && isCorrect && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-none">
                    Correct Answer
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="pt-1">
          <textarea
            rows={3}
            className="w-full rounded-none border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-200 transition-colors"
            placeholder="Write your essay answer here for testing..."
            value={(userAnswer as string) ?? ""}
            onChange={(e) => onChangeEssay(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
