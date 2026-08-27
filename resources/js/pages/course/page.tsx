import { Head } from "@inertiajs/react"
import { useState, useMemo } from "react"
import WelcomeLayout from "@/components/templates/WelcomeLayout"
import Title from "@/components/atoms/Title"
import Badge from "@/components/atoms/Badge"
import Button from "@/components/atoms/Button"
import InputField from "@/components/molecules/InputField"
import CourseCard from "@/components/molecules/CourseCard"
import { Course as CourseType } from "@/types"
import { Search, BookOpen, Filter, Sparkles, X } from "lucide-react"

type RecommendedCourse = CourseType & {
  recommendation_reason?: string
  matching_tags?: string[]
  recommendation_score?: number
}

interface CoursePageProps {
  courses: CourseType[]
  recommendedCourses?: RecommendedCourse[]
}

export default function CoursePage({
  courses = [],
  recommendedCourses = [],
}: CoursePageProps) {
  const [search, setSearch] = useState("")
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [onlyRecommended, setOnlyRecommended] = useState(false)

  const filteredCourses = useMemo(() => {
    const list = onlyRecommended ? recommendedCourses : courses
    return list.filter((course) => {
      const matchSearch =
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        (course.description?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (course.creator?.name?.toLowerCase().includes(search.toLowerCase()) ?? false)

      const matchLevel =
        selectedLevel === "all" || course.level?.toLowerCase() === selectedLevel.toLowerCase()

      const matchType =
        selectedType === "all" || course.type?.toLowerCase() === selectedType.toLowerCase()

      return matchSearch && matchLevel && matchType
    })
  }, [courses, recommendedCourses, onlyRecommended, search, selectedLevel, selectedType])

  return (
    <>
      <Head title="Explore Courses" />

      <div className="pt-24 pb-20 bg-[#FAFAF8] min-h-screen">
        {/* Header Hero Section (Clean, no recommended button) */}
        <div className="bg-[#1a1a1a] text-white py-16 px-6 sm:px-8 mb-10">
          <div className="max-w-7xl mx-auto space-y-4">
            <Badge variant="purple" dot className="!rounded-none">
              Public Catalog
            </Badge>
            <Title as="h1" className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Explore Our Digital Courses
            </Title>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
              Browse through top-rated courses taught by expert instructors. Upgrade your skills today.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-6">
          {/* Search & Filter Bar */}
          <div className="bg-white border border-slate-200 p-6 flex flex-col md:flex-row md:items-end justify-between gap-6 shadow-xs">
            <div className="w-full md:w-80">
              <InputField
                label="Search Course"
                placeholder="Search title, description, or instructor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="!rounded-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Level Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Level
                </span>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-purple-700 focus:ring-1 focus:ring-purple-700"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              {/* Recommended Filter (Right next to Level select) */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" /> Recommendation
                </span>
                <button
                  type="button"
                  onClick={() => setOnlyRecommended((prev) => !prev)}
                  className={`inline-flex items-center gap-2 border px-3 py-2 text-sm font-semibold transition cursor-pointer ${
                    onlyRecommended
                      ? "bg-purple-700 border-purple-700 text-white shadow-xs"
                      : "bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
                  }`}
                >
                  <span>{onlyRecommended ? "Recommended: ON" : "Recommended for You"}</span>
                  {recommendedCourses.length > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 ${
                        onlyRecommended
                          ? "bg-amber-400 text-slate-900"
                          : "bg-purple-200 text-purple-800"
                      }`}
                    >
                      {recommendedCourses.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Access Type Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">Type</span>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-purple-700 focus:ring-1 focus:ring-purple-700"
                >
                  <option value="all">All Types</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Banner notification when Recommended Filter is Active */}
          {onlyRecommended && (
            <div className="bg-purple-50 border border-purple-200 p-4 flex items-center justify-between gap-3 text-xs text-purple-900">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-600 shrink-0" />
                <span>
                  Showing <strong>{filteredCourses.length} personalized recommendations</strong> based on your learning activity and interests.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOnlyRecommended(false)}
                className="inline-flex items-center gap-1 font-semibold text-purple-700 hover:text-purple-900 cursor-pointer"
              >
                <X size={14} /> Clear
              </button>
            </div>
          )}

          {/* Course Grid */}
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourses.map((course) => (
                <div key={course.id || course.slug} className="flex flex-col">
                  {onlyRecommended && (course as RecommendedCourse).recommendation_reason && (
                    <div className="mb-2 bg-purple-50 border border-purple-200 px-2.5 py-1 text-[11px] text-purple-800 font-medium flex items-center gap-1.5">
                      <Sparkles size={12} className="text-purple-600 shrink-0" />
                      <span className="truncate">{(course as RecommendedCourse).recommendation_reason}</span>
                    </div>
                  )}
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 bg-white border border-slate-200 p-8 text-center space-y-4 shadow-xs">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">No Courses Found</h3>
                <p className="text-xs text-slate-500">
                  {onlyRecommended
                    ? "No recommended courses match the current filter. Try resetting filters."
                    : "Try adjusting your search terms or filter options."}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("")
                  setSelectedLevel("all")
                  setSelectedType("all")
                  setOnlyRecommended(false)
                }}
                className="!rounded-none"
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

CoursePage.layout = (page: React.ReactNode) => (
  <WelcomeLayout>{page}</WelcomeLayout>
)
