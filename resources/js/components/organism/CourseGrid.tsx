import CourseCard from "@/components/molecules/CourseCard"

export default function CourseGrid({ courses = [] }: { courses?: any[] }) {
  if (!courses.length) {
    return (
      <div className="text-sm text-neutral-500">
        No courses available
      </div>
    )
  }

  return (
    <div className="
      grid
      grid-cols-1
      md:grid-cols-2
      xl:grid-cols-3
      gap-4
    ">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  )
}
