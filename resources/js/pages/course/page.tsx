import { Head } from "@inertiajs/react"
import { useState, useMemo } from "react"
import WelcomeLayout from "@/components/templates/WelcomeLayout"
import Title from "@/components/atoms/Title"
import Badge from "@/components/atoms/Badge"
import Button from "@/components/atoms/Button"
import InputField from "@/components/molecules/InputField"
import CourseCard from "@/components/molecules/CourseCard"
import { Course as CourseType } from "@/types"
import { Search, BookOpen, Filter } from "lucide-react"

interface CoursePageProps {
  courses: CourseType[]
}

export default function CoursePage({ courses = [] }: CoursePageProps) {
  const [search, setSearch] = useState("")
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
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
  }, [courses, search, selectedLevel, selectedType])

  return (
    <>
      <Head title="Explore Courses" />

      <div className="pt-24 pb-20 bg-[#FAFAF8] min-h-screen">
        {/* Header Hero Section */}
        <div className="bg-[#1a1a1a] text-white py-16 px-6 sm:px-8 mb-12">
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

        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
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

          {/* Course Grid */}
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard key={course.slug} course={course} />
              ))}
            </div>
          ) : (
            <div className="py-20 bg-white border border-slate-200 p-8 text-center space-y-4 shadow-xs">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">No Courses Found</h3>
                <p className="text-xs text-slate-500">
                  Try adjusting your search terms or filter options.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("")
                  setSelectedLevel("all")
                  setSelectedType("all")
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
