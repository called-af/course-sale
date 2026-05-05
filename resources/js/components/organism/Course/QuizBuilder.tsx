import { usePage } from "@inertiajs/react"
import { Plus, GripVertical, Trash2 } from "lucide-react"

import Button from "@/components/atoms/Button"
import InputField from "@/components/molecules/InputField"
import TextAreaField from "@/components/molecules/TextAreaField"
import ChooseFile from "@/components/molecules/ChooseFile"
import ConfirmationDelete from "@/components/molecules/ConfirmationDelete"

import { useQuiz, QuizQuestion, QuizOption } from "@/hooks/useQuiz"

interface Props {
  courseSlug: string
  moduleId: number
  materialId: number
  contentId: number
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
      className={`flex items-center gap-2 px-3 py-2 border transition-all cursor-pointer group
        ${option.is_correct
          ? "border-emerald-200 bg-emerald-50"
          : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
        }`}
      onClick={() => onSetCorrect(index)}
    >
      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
        ${option.is_correct
          ? "border-emerald-500 bg-emerald-500"
          : "border-gray-300 group-hover:border-violet-300"
        }`}
      >
        {option.is_correct && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
      </div>

      <span className={`text-xs font-bold flex-shrink-0 w-4
        ${option.is_correct ? "text-emerald-600" : "text-gray-400"}`}
      >
        {String.fromCharCode(65 + index)}
      </span>

      <div className="flex-1" onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          value={option.option_text}
          onChange={(e) => onUpdate(index, { option_text: e.target.value })}
          placeholder={`Pilihan ${String.fromCharCode(65 + index)}...`}
          className={`w-full text-sm bg-transparent border-none outline-none placeholder-gray-300
            ${option.is_correct ? "text-emerald-700 font-medium" : "text-gray-700"}`}
        />
      </div>

      {option.is_correct && (
        <span className="text-[10px] font-semibold text-emerald-500 flex-shrink-0">✓ Benar</span>
      )}

      {canRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(index) }}
          className="p-1 text-gray-200 hover:text-red-400 transition-colors flex-shrink-0"
        >
          <Trash2 size={12} />
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
    <div className="border border-gray-200 bg-white">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <GripVertical size={14} className="text-gray-300 flex-shrink-0" />

        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Soal {index + 1}
        </span>

        <div className="flex items-center ml-auto bg-white border border-gray-200 p-0.5">
          {(["multiple_choice", "essay"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onUpdate(question._key, { type: t })}
              className={`px-3 py-1 text-xs font-medium transition-all
                ${question.type === t
                  ? "bg-violet-500 text-white"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              {t === "multiple_choice" ? "Pilihan Ganda" : "Essay"}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onConfirmDelete(question)}
          className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
          <TextAreaField
            label="Pertanyaan"
            name="question"
            rows={3}
            value={question.question}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onUpdate(question._key, { question: e.target.value })
            }
            placeholder="Tulis pertanyaan di sini..."
          />

          <div className="w-28 flex-shrink-0">
            <ChooseFile
              label="Gambar (opsional)"
              aspect="square"
              value={question.image ?? null}
              onChange={(file) =>
                onUpdate(question._key, { imageFile: file })
              }
            />
          </div>
        </div>

        {question.type === "multiple_choice" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Pilihan Jawaban
              </p>
              <p className="text-[10px] text-gray-300">
                · klik baris untuk tandai jawaban benar
              </p>
            </div>

            <div className="space-y-1.5">
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

            {question.quiz_options.length < 6 && (
              <button
                type="button"
                onClick={() => onAddOption(question._key)}
                className="flex items-center gap-1.5 text-xs text-violet-500 hover:text-violet-700 font-medium transition-colors"
              >
                <Plus size={12} />
                Tambah pilihan
              </button>
            )}

            {!question.quiz_options.some((o) => o.is_correct) && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-100">
                <span className="text-amber-400 text-xs">⚠</span>
                <p className="text-[11px] text-amber-600 font-medium">
                  Belum ada jawaban benar yang dipilih
                </p>
              </div>
            )}
          </div>
        )}

        {question.type === "essay" && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 border border-blue-100">
              <svg className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-blue-600">
                Siswa menjawab secara bebas dalam bentuk teks. Penilaian dilakukan manual oleh instruktur.
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Tampilan untuk siswa
              </p>
              <div className="border border-dashed border-gray-200 bg-gray-50 px-3 py-3">
                <div className="w-full min-h-16 flex items-start">
                  <p className="text-xs text-gray-300 italic">Tulis jawaban kamu di sini...</p>
                </div>
                <div className="mt-2 flex justify-between items-center border-t border-gray-200 pt-2">
                  <p className="text-[10px] text-gray-300">0 kata</p>
                  <div className="h-5 w-20 bg-violet-100 rounded-sm" />
                </div>
              </div>
            </div>
          </div>
        )}

        {question.type === "essay" && (
          <div className="px-3 py-2.5 bg-blue-50 border border-blue-100">
            <p className="text-xs text-blue-600">
              Siswa menjawab soal ini secara bebas dalam bentuk teks.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function QuizBuilder({ courseSlug, moduleId, materialId, contentId }: Props) {
  const { props } = usePage<{ quizQuestions?: any[] }>()

  const quiz = useQuiz(
    courseSlug,
    moduleId,
    materialId,
    contentId,
    props.quizQuestions ?? [],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Bank Soal
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {quiz.questions.length} soal
          </p>
        </div>

        <button
          type="button"
          onClick={quiz.addQuestion}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-violet-300 text-violet-600 text-xs font-medium hover:bg-violet-50 transition-colors"
        >
          <Plus size={13} />
          Tambah Soal
        </button>
      </div>

      {quiz.errors && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-sm text-red-600">
          {quiz.errors}
        </div>
      )}

      <div className="space-y-3">
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

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <Button onClick={quiz.save} disabled={quiz.processing}>
          {quiz.processing ? "Menyimpan..." : "Simpan Semua Soal"}
        </Button>
        <p className="text-xs text-gray-400">
          Perubahan soal tidak tersimpan otomatis.
        </p>
      </div>

      <ConfirmationDelete
        open={!!quiz.deleteTarget}
        onClose={quiz.cancelDelete}
        onConfirm={quiz.executeDelete}
        isLoading={quiz.processing}
        title="Hapus Soal"
        message={`Yakin ingin menghapus soal "${quiz.deleteTarget?.question || "ini"}"? Tindakan ini tidak bisa dibatalkan.`}
      />
    </div>
  )
}