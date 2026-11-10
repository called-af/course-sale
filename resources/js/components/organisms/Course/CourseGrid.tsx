import CourseCard from '@/components/molecules/CourseCard';
import type { Course } from '@/types';

interface CourseGridProps {
    courses?: Course[];
    /** Marks courses as enrolled by the viewer (e.g. student "My Learning"). */
    enrolled?: boolean;
}

export default function CourseGrid({ courses = [], enrolled = false }: CourseGridProps) {
    if (!courses.length) {
        return <div className="text-sm text-neutral-500">No courses available</div>;
    }

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
                <CourseCard key={course.id} course={course} enrolled={enrolled} />
            ))}
        </div>
    );
}
