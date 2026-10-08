import { ArrowUpRight, BadgeDollarSign, Sparkles, Star } from 'lucide-react';
import type { CourseSummary } from '@/components/ai/types';

interface CourseRecommendationCardProps {
  course: CourseSummary;
}

export default function CourseRecommendationCard({ course }: CourseRecommendationCardProps) {
  const title = typeof course.title === 'string' && course.title.trim() ? course.title : 'Kursus tanpa judul';
  const courseHref = course.slug
    ? `/course/${encodeURIComponent(course.slug)}`
    : `/course/id/${encodeURIComponent(String(course.id))}`;
  const hasRating = Number(course.rating_count) > 0 && course.rating !== null && course.rating !== undefined;

  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-purple-800">
      <div className="flex min-h-28 gap-3 p-3">
        <div className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-600 dark:from-purple-950/60 dark:to-indigo-950/40 dark:text-purple-400">
          {course.thumbnail_url && (
            <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-1 text-[11px] capitalize text-slate-500 dark:text-slate-400">{course.level ?? 'level tidak ditentukan'}</p>
            </div>
          </div>
          {course.reason && (
            <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              <Sparkles className="mr-1 inline h-3 w-3 text-amber-500" />{course.reason}
            </p>
          )}
          <a
            href={courseHref}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-purple-600 transition hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
          >
            Lihat course <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-[10px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <div className="flex items-center gap-1"><BadgeDollarSign className="h-3 w-3" />{course.score !== null && course.score !== undefined ? `Poin ${course.score}` : 'Course'}</div>
        {hasRating && <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{Number(course.rating).toFixed(2)} ({course.rating_count})</span>}
      </div>
    </article>
  );
}
