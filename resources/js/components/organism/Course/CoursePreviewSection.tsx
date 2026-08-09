import { useMemo, useState } from "react"
import { Link, usePage } from "@inertiajs/react"
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  ExternalLink,
  File,
  FileText,
  HelpCircle,
  Presentation,
  Sparkles,
  Download,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"

import Button from "@/components/atoms/Button"
import Badge from "@/components/atoms/Badge"
import Title from "@/components/atoms/Title"
import SlatePreview from "@/components/molecules/SlatePreview"
import { Course } from "@/types"

const TYPE_ICONS: Record<string, typeof FileText> = {
  video: FileText,
  text: FileText,
  quiz: HelpCircle,
  file: File,
  ppt: Presentation,
}

const TYPE_LABELS: Record<string, string> = {
  video: "Video Lesson",
  text: "Text / Article",
  quiz: "Quiz & Evaluation",
  file: "File Attachment",
  ppt: "Presentation Slide",
}

function getEmbedUrl(url?: string | null) {
  if (!url) return null
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`
  }
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/)
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }
  return url
}

function parseSlateText(contentText: any) {
  if (!contentText) return []
  if (typeof contentText === "string") {
    try {
      return JSON.parse(contentText)
    } catch {
      return [{ type: "paragraph", children: [{ text: contentText }] }]
    }
  }
  return contentText
}

function formatStatusBadge(status: string) {
  if (status === "draft") return "warning"
  return "success"
}

export default function CoursePreviewSection({ course }: { course: Course }) {
  const { auth } = usePage().props as any
  const rolePrefix = auth?.user?.role ?? "admin"
  const courseBackUrl = `/${rolePrefix}/courses/${course.slug}`

  const flatContents = useMemo(() => {
    const list: {
      content: any
      materialTitle: string
      moduleTitle: string
    }[] = []

    course.modules?.forEach((module) => {
      module.materials?.forEach((material) => {
        material.contents?.forEach((content) => {
          list.push({
            content,
            materialTitle: material.title,
            moduleTitle: module.title,
          })
        })
      })
    })

    return list
  }, [course])

  const [selectedContentId, setSelectedContentId] = useState<number | null>(
    flatContents.length > 0 ? flatContents[0].content.id : null
  )
  const [sidebarSearch, setSidebarSearch] = useState("")
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>(
    () => {
      const initial: Record<number, boolean> = {}
      course.modules?.forEach((mod) => {
        initial[mod.id] = true
      })
      return initial
    }
  )
  const [userAnswers, setUserAnswers] = useState<Record<number, number | string>>({})
  const [showAnswers, setShowAnswers] = useState(false)
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  const resetQuizState = () => {
    setUserAnswers({})
    setShowAnswers(false)
    setQuizSubmitted(false)
  }

  const activeItemIndex = useMemo(() => {
    return flatContents.findIndex((item) => item.content.id === selectedContentId)
  }, [flatContents, selectedContentId])

  const activeItem = useMemo(() => {
    if (activeItemIndex >= 0) return flatContents[activeItemIndex]
    return flatContents[0] ?? null
  }, [flatContents, activeItemIndex])

  const filteredModules = useMemo(() => {
    if (!sidebarSearch.trim()) return course.modules ?? []

    const term = sidebarSearch.toLowerCase()

    return (course.modules ?? [])
      .map((mod) => ({
        ...mod,
        materials: (mod.materials ?? [])
          .map((mat) => ({
            ...mat,
            contents: (mat.contents ?? []).filter((content) =>
              content.title.toLowerCase().includes(term)
            ),
          }))
          .filter((mat) => mat.contents.length > 0),
      }))
      .filter((mod) => mod.materials.length > 0)
  }, [course, sidebarSearch])

  const handleSelectContent = (id: number) => {
    setSelectedContentId(id)
    resetQuizState()
  }

  const handlePrev = () => {
    if (activeItemIndex > 0) {
      setSelectedContentId(flatContents[activeItemIndex - 1].content.id)
      resetQuizState()
    }
  }

  const handleNext = () => {
    if (activeItemIndex < flatContents.length - 1) {
      setSelectedContentId(flatContents[activeItemIndex + 1].content.id)
      resetQuizState()
    }
  }

  const quizScore = useMemo(() => {
    if (!activeItem?.content?.quiz_questions) return { correct: 0, total: 0, percentage: 0 }
    const questions = activeItem.content.quiz_questions.filter(
      (q: any) => q.type === "multiple_choice"
    )
    const correct = questions.reduce((sum: number, question: any) => {
      const selected = userAnswers[question.id]
      const correctOption = question.quiz_options.find((opt: any) => opt.is_correct)
      return sum + (selected && correctOption && Number(selected) === correctOption.id ? 1 : 0)
    }, 0)
    const total = questions.length
    return {
      correct,
      total,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    }
  }, [activeItem, userAnswers])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <Link
                  href={courseBackUrl}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600 hover:bg-slate-100"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to course
                </Link>
                <Badge variant={course.status === "draft" ? "warning" : "success"}>
                  {course.status.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-2">
                <Title as="h1" className="text-slate-900">
                  {course.title}
                </Title>
                <p className="max-w-3xl text-sm leading-6 text-slate-600">
                  {course.description ?? "Preview halaman course ini menampilkan semua materi dan quiz seperti pengunjung."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                {course.creator?.name && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                    {course.creator.name}
                  </span>
                )}
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {course.level ?? "All Levels"}
                </span>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="hidden lg:block rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                  <span>Course Outline</span>
                  <Badge variant="info">{flatContents.length} items</Badge>
                </div>
                <p className="text-sm text-slate-500">
                  Gunakan navigasi ini untuk melihat setiap bagian materi dalam course.
                </p>
              </div>

              <div className="relative">
                <input
                  type="search"
                  placeholder="Cari lesson..."
                  value={sidebarSearch}
                  onChange={(event) => setSidebarSearch(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div className="space-y-3">
                {filteredModules.length === 0 ? (
                  <p className="text-sm text-slate-500">Tidak ada materi yang cocok.</p>
                ) : (
                  filteredModules.map((module, moduleIndex) => {
                    const isExpanded = expandedModules[module.id] ?? true

                    return (
                      <div key={module.id} className="rounded-3xl border border-slate-200 bg-slate-50">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedModules((prev) => ({
                              ...prev,
                              [module.id]: !prev[module.id],
                            }))
                          }
                          className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-800 flex items-center justify-between gap-3"
                        >
                          <span>
                            MOD {String(moduleIndex + 1).padStart(2, "0")}: {module.title}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </button>

                        {isExpanded && (
                          <div className="space-y-2 border-t border-slate-200 px-3 py-3">
                            {module.materials?.map((material) => (
                              <div key={material.id} className="space-y-2">
                                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                  {material.title}
                                </div>
                                <div className="space-y-1">
                                  {material.contents?.map((content) => {
                                    const isActive = content.id === selectedContentId
                                    const Icon = TYPE_ICONS[content.type] ?? FileText

                                    return (
                                      <button
                                        key={content.id}
                                        type="button"
                                        onClick={() => handleSelectContent(content.id)}
                                        className={`w-full rounded-2xl px-3 py-3 text-left transition ${
                                          isActive
                                            ? "bg-purple-600 text-white shadow"
                                            : "bg-white text-slate-700 hover:bg-slate-100"
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <Icon className="w-4 h-4 text-slate-400" />
                                          <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{content.title}</p>
                                            <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                                              <span className="rounded-full bg-slate-100 px-2 py-1">{content.type}</span>
                                              {content.duration && <span>{content.duration}m</span>}
                                            </div>
                                          </div>
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <div className="lg:hidden rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                  <span>Course Outline</span>
                  <Badge variant="info">{flatContents.length}</Badge>
                </div>
                <input
                  type="search"
                  placeholder="Cari lesson..."
                  value={sidebarSearch}
                  onChange={(event) => setSidebarSearch(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
                <div className="space-y-3">
                  {filteredModules.length === 0 ? (
                    <p className="text-sm text-slate-500">Tidak ada materi yang cocok.</p>
                  ) : (
                    filteredModules.map((module) => {
                      const isExpanded = expandedModules[module.id] ?? true
                      return (
                        <div key={module.id} className="rounded-3xl border border-slate-200 bg-slate-50">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedModules((prev) => ({
                                ...prev,
                                [module.id]: !prev[module.id],
                              }))
                            }
                            className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-800 flex items-center justify-between gap-3"
                          >
                            <span>{module.title}</span>
                            <ChevronDown className={`w-4 h-4 text-slate-500 ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                          {isExpanded && (
                            <div className="space-y-2 border-t border-slate-200 px-3 py-3">
                              {module.materials?.map((material) => (
                                <div key={material.id} className="space-y-2">
                                  {material.contents?.map((content) => {
                                    const isActive = content.id === selectedContentId
                                    const Icon = TYPE_ICONS[content.type] ?? FileText
                                    return (
                                      <button
                                        key={content.id}
                                        type="button"
                                        onClick={() => handleSelectContent(content.id)}
                                        className={`w-full rounded-2xl px-3 py-3 text-left transition ${
                                          isActive
                                            ? "bg-purple-600 text-white shadow"
                                            : "bg-white text-slate-700 hover:bg-slate-100"
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <Icon className="w-4 h-4 text-slate-400" />
                                          <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">{content.title}</p>
                                          </div>
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              {!activeItem ? (
                <div className="space-y-4 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-600">
                  <BookOpen className="mx-auto h-12 w-12" />
                  <p className="text-lg font-semibold">Tidak ada materi untuk ditampilkan.</p>
                  <p className="text-sm">Pastikan course memiliki materi yang sudah dibuat agar preview bisa berjalan.</p>
                  <Link
                    href={courseBackUrl}
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Kembali ke Manajemen Course
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{activeItem.moduleTitle}</span>
                        <span>•</span>
                        <span>{activeItem.materialTitle}</span>
                      </div>
                      <h2 className="text-2xl font-semibold text-slate-900">{activeItem.content.title}</h2>
                      <div className="flex flex-wrap gap-2 items-center">
                        <Badge variant="purple">{TYPE_LABELS[activeItem.content.type] ?? activeItem.content.type}</Badge>
                        <Badge variant={formatStatusBadge(activeItem.content.status)}>
                          {activeItem.content.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" onClick={handlePrev} disabled={activeItemIndex <= 0}>
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <Button variant="primary" onClick={handleNext} disabled={activeItemIndex >= flatContents.length - 1}>
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {activeItem.content.type === "video" && (
                      <div className="space-y-4">
                        <div className="aspect-video overflow-hidden rounded-3xl bg-slate-900">
                          {activeItem.content.content_url ? (
                            getEmbedUrl(activeItem.content.content_url) ? (
                              <iframe
                                src={getEmbedUrl(activeItem.content.content_url)!}
                                className="h-full w-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={activeItem.content.title}
                              />
                            ) : (
                              <video
                                src={activeItem.content.content_url}
                                controls
                                className="h-full w-full object-contain"
                              />
                            )
                          ) : (
                            <div className="flex h-full items-center justify-center p-8 text-slate-400">
                              <span>No video source available</span>
                            </div>
                          )}
                        </div>

                        {activeItem.content.content_url && (
                          <div className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                            <span className="truncate">{activeItem.content.content_url}</span>
                            <a
                              href={activeItem.content.content_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-purple-600 border border-purple-200 hover:bg-purple-50"
                            >
                              Open URL <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {activeItem.content.type === "text" && (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                        <SlatePreview value={parseSlateText(activeItem.content.content_text)} />
                      </div>
                    )}

                    {activeItem.content.type === "file" && (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <File className="w-8 h-8" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-900">{activeItem.content.title}</h3>
                        <p className="mt-2 text-sm text-slate-500">Downloadable learning material.</p>
                        {activeItem.content.content_url ? (
                          <a
                            href={activeItem.content.content_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
                          >
                            <Download className="w-4 h-4" /> Download File
                          </a>
                        ) : (
                          <div className="mt-5 text-sm text-slate-500">No file link provided.</div>
                        )}
                      </div>
                    )}

                    {activeItem.content.type === "ppt" && (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                          <Presentation className="w-8 h-8" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-900">{activeItem.content.title}</h3>
                        <p className="mt-2 text-sm text-slate-500">Presentation slide deck.</p>
                        {activeItem.content.content_url ? (
                          <a
                            href={activeItem.content.content_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-500"
                          >
                            Open Slides <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : (
                          <div className="mt-5 text-sm text-slate-500">No presentation URL provided.</div>
                        )}
                      </div>
                    )}

                    {activeItem.content.type === "quiz" && (
                      <div className="space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                        <div className="rounded-3xl bg-white p-5 shadow-sm">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                              <div className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600 uppercase tracking-[0.15em]">
                                <HelpCircle className="w-4 h-4" /> Quiz Evaluation
                              </div>
                              <h3 className="text-xl font-semibold text-slate-900">{activeItem.content.title}</h3>
                              <p className="text-sm text-slate-500">Coba sendiri sebagai gambaran pengalaman siswa.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {activeItem.content.duration && (
                                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-600">
                                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                                  {activeItem.content.duration} mins
                                </span>
                              )}
                              <Button
                                variant={showAnswers ? "secondary" : "outline"}
                                onClick={() => setShowAnswers((prev) => !prev)}
                              >
                                {showAnswers ? "Hide Answers" : "Show Answers"}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {!activeItem.content.quiz_questions || activeItem.content.quiz_questions.length === 0 ? (
                          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
                            <p className="text-sm font-semibold text-slate-900">No quiz questions found yet.</p>
                            <p className="text-sm">Tambahkan pertanyaan di editor materi untuk mengaktifkan preview quiz.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {activeItem.content.quiz_questions.map((question: any, questionIndex: number) => (
                              <div key={question.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="space-y-2">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                                      Question {questionIndex + 1}
                                    </div>
                                    <p className="text-sm font-semibold text-slate-900">{question.question}</p>
                                  </div>
                                </div>

                                {question.image && (
                                  <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200">
                                    <img src={question.image} alt="Question image" className="w-full object-cover" />
                                  </div>
                                )}

                                {question.type === "multiple_choice" ? (
                                  <div className="mt-4 space-y-3">
                                    {question.quiz_options?.map((option: any, optionIndex: number) => {
                                      const selected = userAnswers[question.id] === option.id
                                      const correct = option.is_correct

                                      return (
                                        <button
                                          key={option.id}
                                          type="button"
                                          onClick={() =>
                                            setUserAnswers((prev) => ({
                                              ...prev,
                                              [question.id]: option.id,
                                            }))
                                          }
                                          className={`w-full rounded-3xl border p-4 text-left transition ${
                                            selected
                                              ? "border-purple-500 bg-purple-50 text-slate-900"
                                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                          } ${showAnswers && correct ? "border-emerald-500 bg-emerald-50" : ""}`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                                              selected ? "bg-purple-500 text-white" : "bg-slate-100 text-slate-600"
                                            }`}>
                                              {String.fromCharCode(65 + optionIndex)}
                                            </div>
                                            <span>{option.option_text}</span>
                                          </div>
                                        </button>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <textarea
                                    rows={4}
                                    className="mt-4 w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                                    placeholder="Tulis jawaban essay di sini..."
                                    value={(userAnswers[question.id] as string) ?? ""}
                                    onChange={(event) =>
                                      setUserAnswers((prev) => ({
                                        ...prev,
                                        [question.id]: event.target.value,
                                      }))
                                    }
                                  />
                                )}
                              </div>
                            ))}

                            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:flex sm:items-center sm:justify-between">
                              <div className="space-y-2">
                                <p className="text-sm text-slate-600">Submit jawaban kamu untuk melihat skor sementara.</p>
                                {quizSubmitted && (
                                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Score: {quizScore.correct}/{quizScore.total} ({quizScore.percentage}%)
                                  </div>
                                )}
                              </div>
                              <div className="mt-4 flex flex-wrap gap-3 sm:mt-0">
                                <Button variant="primary" onClick={() => setQuizSubmitted(true)}>
                                  Submit
                                </Button>
                                <Button variant="outline" onClick={resetQuizState}>
                                  Reset
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
