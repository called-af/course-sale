import React, { useMemo, useState } from "react"
import { HelpCircle, Clock, AlertCircle, CheckCircle2, RotateCcw, Eye, EyeOff } from "lucide-react"
import Button from "@/components/atoms/Button"
import PreviewQuizQuestion from "@/components/molecules/CoursePreview/PreviewQuizQuestion"

interface QuizQuestion {
  id: number
  question: string
  image?: string | null
  type: string
  quiz_options?: {
    id: number
    option_text: string
    is_correct: boolean
  }[]
}

interface CourseQuizRunnerProps {
  title: string
  duration?: number | null
  quizQuestions?: QuizQuestion[]
}

export default function CourseQuizRunner({
  title,
  duration,
  quizQuestions = [],
}: CourseQuizRunnerProps) {
  const [userAnswers, setUserAnswers] = useState<Record<number, number | string>>({})
  const [showAnswers, setShowAnswers] = useState(false)
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  const resetQuizState = () => {
    setUserAnswers({})
    setShowAnswers(false)
    setQuizSubmitted(false)
  }

  const quizScore = useMemo(() => {
    const mcQuestions = quizQuestions.filter((q) => q.type === "multiple_choice")
    const correct = mcQuestions.reduce((sum, question) => {
      const selected = userAnswers[question.id]
      const correctOption = question.quiz_options?.find((opt) => opt.is_correct)
      return (
        sum + (selected && correctOption && Number(selected) === correctOption.id ? 1 : 0)
      )
    }, 0)
    const total = mcQuestions.length
    return {
      correct,
      total,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    }
  }, [quizQuestions, userAnswers])

  return (
    <div className="space-y-4 py-2">
      {/* Quiz Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Quiz & Evaluation
          </span>
        </div>
        <div className="flex items-center gap-2">
          {duration && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {duration}m
            </span>
          )}
          <Button
            variant={showAnswers ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowAnswers((prev) => !prev)}
            leftIcon={showAnswers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            className="!rounded-none"
          >
            {showAnswers ? "Hide Answers" : "Show Answers"}
          </Button>
        </div>
      </div>

      {/* Questions List or Empty State */}
      {!quizQuestions || quizQuestions.length === 0 ? (
        <div className="py-8 text-center text-slate-400 space-y-1">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-500" />
          <p className="text-sm font-semibold text-slate-700">No quiz questions found.</p>
          <p className="text-xs text-slate-400">Add questions inside the material editor.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {quizQuestions.map((question, index) => (
            <PreviewQuizQuestion
              key={question.id}
              question={question}
              questionIndex={index}
              userAnswer={userAnswers[question.id]}
              showAnswers={showAnswers}
              onSelectOption={(optionId) =>
                setUserAnswers((prev) => ({ ...prev, [question.id]: optionId }))
              }
              onChangeEssay={(text) =>
                setUserAnswers((prev) => ({ ...prev, [question.id]: text }))
              }
            />
          ))}

          {/* Submission & Score Action Bar */}
          <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              {quizSubmitted && (
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-none border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Score: {quizScore.correct}/{quizScore.total} ({quizScore.percentage}%)
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setQuizSubmitted(true)}
                className="!rounded-none"
              >
                Submit Test
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetQuizState}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                className="!rounded-none"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
