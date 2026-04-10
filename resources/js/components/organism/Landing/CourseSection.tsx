import Title from "@/components/atoms/Title"
import Badge from "@/components/atoms/Badge"
import Button from "@/components/atoms/Button"
import InputField from "@/components/molecules/InputField"
import CourseCard from "@/components/molecules/CourseCard"
import { useCourse } from "@/hooks/useCourse"
import { Course } from "@/types"
import { ArrowRight } from "lucide-react"

interface CourseSectionProps {
  courses: Course[]
}

export default function CourseSection({ courses }: CourseSectionProps) {
  const { search, setSearch, filteredCourses } = useCourse(undefined, courses)

  return (
    <section className="bg-[#FAFAF8] py-24" id="courses">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="flex flex-col gap-4">
            <Badge variant="purple" dot>
              Kursus Pilihan
            </Badge>
            <Title as="h2" className="leading-tight" style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)" }}>
              Temukan Kursus yang
              <span className="bg-purple-400 px-2 ml-2 inline-block">Tepat Untukmu</span>
            </Title>
          </div>

          <div className="w-full lg:w-72">
            <InputField
              label="Search Courses"
              placeholder="Search title or instructor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCourses.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center gap-3 text-center">
            <Title as="h4" className="text-gray-400">Kursus tidak ditemukan</Title>
            <p className="text-sm text-gray-400">Coba kata kunci lain atau reset pencarian</p>
            <Button variant="outline" className="mt-2" onClick={() => setSearch("")}>
              Reset Pencarian
            </Button>
          </div>
        )}

        {filteredCourses.length > 0 && (
          <div className="mt-12 flex justify-center">
            <Button
              variant="outline"
              rightIcon={<ArrowRight size={16} />}
              className="px-8 py-3 text-base"
            >
              Lihat Semua Kursus
            </Button>
          </div>
        )}

      </div>
    </section>
  )
}