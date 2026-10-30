import { usePage } from "@inertiajs/react"
import { Plus, GripVertical, Trash2, Check, AlertCircle, HelpCircle, FileText, Sparkles, Layers, Image as ImageIcon } from "lucide-react"

import Button from "@/components/atoms/Button"
import TextAreaField from "@/components/molecules/TextAreaField"
import ChooseFile from "@/components/molecules/ChooseFile"
import ConfirmationDelete from "@/components/molecules/ConfirmationDelete"

import { useQuiz, QuizQuestion, QuizOption } from "@/hooks/useQuiz"

interface Props {
  courseSlug: string
  moduleId: number
  materialId: number
  contentId: number
  routePrefix: "admin" | "instructor"
}

function OptionRow({
  option, index, canRemove, onUpdate, onRemove, onSetCorrect,
}: {
  option: QuizOption
  index: number
  canRemove: boolean
  onUpdate: (i: number, patch: Partial<QuizOption>) => void
  onRemove: (i: number) => void
  onSetCorrect: (i: number) => void
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3.5 py-2.5 border transition-all cursor-pointer group ${
        option.is_correct
            ? "border-emerald-300 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-500/20 dark:border-emerald-800 dark:bg-emerald-950/40"
            : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60 dark:border-slate-700 dark:bg-[#1e1f24] dark:hover:border-slate-600 dark:hover:bg-slate-700"
      }`}
      onClick={() => onSetCorrect(index)}
    >
      <div className={`w-5 h-5 border-2 flex-shrink-0 flex items-center justify-center transition-all ${
        option.is_correct
            ? "border-emerald-500 bg-emerald-500 text-white shadow-xs"
            : "border-slate-300 group-hover:border-indigo-400 bg-white dark:border-slate-600 dark:bg-[#1e1f24]"
      }`}>
        {option.is_correct && <Check className="w-3 h-3 stroke-[3]" />}
      </div>

      <span className={`text-xs font-bold flex-shrink-0 w-5 h-5 flex items-center justify-center ${
        option.is_correct ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300"
            }`}>
        {String.fromCharCode(65 + index)}
      </span>

      <div className="flex-1" onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={option.option_text}
          onChange={(e) => onUpdate(index, { option_text: e.target.value })}
          placeholder={`Option ${String.fromCharCode(65 + index)}...`}
          className={`w-full text-sm bg-transparent border-none outline-none placeholder-slate-300 ${
            option.is_correct ? "text-emerald-950 font-semibold dark:text-emerald-100" : "text-slate-700 dark:text-slate-200"
          }`}
        />
      </div>

      {option.is_correct && (
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/70 px-2 py-0.5 flex-shrink-0">
          ✓ Correct Answer
        </span>
      )}

      {canRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(index) }}
          className="p-1.5 text-slate-300 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
          title="Remove Option"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
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
  question: QuizQuestion
  index: number
  onUpdate: (key: string, patch: Partial<QuizQuestion>) => void
  onConfirmDelete: (q: QuizQuestion) => void
  onAddOption: (key: string) => void
  onRemoveOption: (key: string, i: number) => void
  onUpdateOption: (key: string, i: number, patch: Partial<QuizOption>) => void
  onSetCorrect: (key: string, i: number) => void
}) {
  return (
    <div className="border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-[#1e1f24] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Question header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50/80 dark:bg-[#1e1f24] border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2.5">
          <GripVertical size={16} className="text-slate-300 dark:text-slate-500 cursor-grab active:cursor-grabbing shrink-0" />
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
            Question #{String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Tipe Selector Switch */}
          <div className="flex items-center bg-slate-200/60 dark:bg-slate-700 p-0.5">
            {(["multiple_choice", "essay"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onUpdate(question._key, { type: t })}
                className={`px-3 py-1 text-xs font-semibold transition-all ${
                  question.type === t
                    ? "bg-white dark:bg-slate-600 text-indigo-900 dark:text-indigo-100 shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {t === "multiple_choice" ? "Multiple Choice" : "Essay"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onConfirmDelete(question)}
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Delete Question"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Teks Pertanyaan & Gambar */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_130px]">
          <TextAreaField
            label="Question Prompt"
            name="question"
            rows={3}
            value={question.question}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onUpdate(question._key, { question: e.target.value })
            }
            placeholder="Write question prompt or instructions here..."
          />

          <div className="space-y-1">
            <ChooseFile
              label="Question Image"
              aspect="square"
              value={question.image ?? null}
              onChange={(file) =>
                onUpdate(question._key, { imageFile: file })
              }
            />
          </div>
        </div>

        {/* Multiple choice */}
        {question.type === "multiple_choice" && (
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Answer Options (Click row to select the correct answer)
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {question.quiz_options.length} options
              </span>
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
                <button
                  type="button"
                  onClick={() => onAddOption(question._key)}
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 font-semibold px-3 py-1.5 border border-indigo-100 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/40 hover:bg-indigo-100/50 dark:hover:bg-indigo-950/70 transition-colors"
                >
                  <Plus size={13} />
                  Add Option
                </button>
              )}

              {!question.quiz_options.some((o) => o.is_correct) && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-xs font-medium">
                  <AlertCircle size={13} className="text-amber-500" />
                  No correct answer selected yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Essay Info */}
        {question.type === "essay" && (
          <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 dark:text-blue-200">
              <FileText size={15} className="text-blue-500" />
              Essay Question
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-300 leading-relaxed">
              Students answer freely using a text box. Essay responses are manually reviewed and graded by the instructor.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function QuizBuilder({ courseSlug, moduleId, materialId, contentId, routePrefix }: Props) {
  const { props } = usePage<{ quizQuestions?: any[] }>()

  const quiz = useQuiz(
    courseSlug,
    moduleId,
    materialId,
    contentId,
    routePrefix,
    props.quizQuestions ?? [],
  )

  const mcCount = quiz.questions.filter((q) => q.type === "multiple_choice").length
  const essayCount = quiz.questions.filter((q) => q.type === "essay").length

  return (
    <div className="space-y-5">
      {/* Question bank header */}
      <div className="p-4 bg-slate-50 dark:bg-[#1e1f24] border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 flex items-center justify-center font-bold">
            <HelpCircle size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Quiz Question Bank</h3>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>Total: <strong className="text-slate-800 dark:text-slate-100">{quiz.questions.length} Questions</strong></span>
              <span>•</span>
              <span>Multiple Choice: <strong className="text-indigo-600 dark:text-indigo-300">{mcCount}</strong></span>
              <span>•</span>
              <span>Essay: <strong className="text-purple-600 dark:text-purple-300">{essayCount}</strong></span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={quiz.addQuestion}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold text-xs border border-rose-200 dark:border-rose-900 transition-colors shadow-xs"
        >
          <Plus size={14} />
          Add New Question
        </button>
      </div>

      {quiz.errors && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-[#1e1f24] border border-slate-200/80 dark:border-slate-700 shadow-xs">
        <Button onClick={quiz.save} disabled={quiz.processing} size="md" className="!rounded-none">
          {quiz.processing ? "Saving Questions..." : "Save All Quiz Questions"}
        </Button>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          Question changes must be saved manually.
        </span>
      </div>

      <ConfirmationDelete
        open={!!quiz.deleteTarget}
        onClose={quiz.cancelDelete}
        onConfirm={quiz.executeDelete}
        isLoading={quiz.processing}
        title="Delete Quiz Question"
        message={`Are you sure you want to delete question "${quiz.deleteTarget?.question || "this"}"? This action cannot be undone.`}
      />
    </div>
  )
}
