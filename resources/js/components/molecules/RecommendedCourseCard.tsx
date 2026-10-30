import { Link } from '@inertiajs/react';
import { Sparkles, Star } from 'lucide-react';
import { formatRupiah } from '@/lib/dashboard';
import type { RecommendedCourse } from '@/types/dashboard';

interface RecommendedCourseCardProps {
    course: RecommendedCourse;
}

export default function RecommendedCourseCard({ course }: RecommendedCourseCardProps) {
    return (
        <Link
            href={`/course/${course.slug}`}
            className="group flex flex-col justify-between overflow-hidden border border-slate-200 bg-white transition hover:border-purple-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-purple-700"
        >
            <div>
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                        src={course.thumbnail_url ?? '/assets/landscape.jpeg'}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {course.recommendation_reason && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-purple-900/80 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                            <Sparkles size={11} className="text-amber-300" />
                            <span>Recommended</span>
                        </div>
                    )}
                </div>

                <div className="space-y-2 p-3.5">
                    <h3 className="line-clamp-2 text-xs font-bold text-slate-800 group-hover:text-purple-700 dark:text-slate-100 dark:group-hover:text-purple-400">
                        {course.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">By {course.creator?.name ?? 'KursusIO'}</p>

                    <div className="flex flex-wrap gap-1">
                        {course.tags?.slice(0, 2).map((tag) => (
                            <span
                                key={tag.id || tag.name}
                                className="bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            >
                                {tag.name}
                            </span>
                        ))}
                        {course.level && (
                            <span className="bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 capitalize dark:bg-purple-950/40 dark:text-purple-300">
                                {course.level}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 p-3.5 pt-2.5 text-xs font-bold dark:border-slate-800">
                <span className={course.type === 'free' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}>
                    {course.type === 'free' ? 'FREE' : formatRupiah(course.price ?? 0)}
                </span>
                {Boolean(course.rating_avg && course.rating_avg > 0) && (
                    <span className="flex items-center gap-0.5 text-[11px] text-amber-600 dark:text-amber-400">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        {course.rating_avg}
                    </span>
                )}
            </div>
        </Link>
    );
}
