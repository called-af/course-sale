import { Link } from '@inertiajs/react';
import { FileText, Play, Video } from 'lucide-react';
import ProgressBar from '@/components/atoms/ProgressBar';
import type { ContinueLearningCourse } from '@/types/dashboard';

interface ContinueLearningBannerProps {
    course: ContinueLearningCourse;
}

export default function ContinueLearningBanner({ course }: ContinueLearningBannerProps) {
    const progress = course.progress_percent ?? 0;
    const resumeUrl = `/student/courses/${course.slug}${
        course.next_material
            ? `?material=${course.next_material.id}${course.next_material.content_id ? `&content=${course.next_material.content_id}` : ''}`
            : ''
    }`;

    return (
        <div className="relative overflow-hidden border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-indigo-50/40 p-5 shadow-sm dark:border-purple-900/50 dark:from-slate-900 dark:via-purple-950/30 dark:to-slate-900">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                    <div className="relative aspect-video w-32 shrink-0 overflow-hidden bg-slate-200 shadow-xs sm:w-40 dark:bg-slate-800">
                        <img
                            src={course.thumbnail_url ?? '/assets/landscape.jpeg'}
                            alt={course.title}
                            className="h-full w-full object-cover"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">
                                <Play size={10} className="fill-purple-600 dark:fill-purple-300" />
                                Continue Where You Left Off
                            </span>
                            {course.level && (
                                <span className="bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 capitalize dark:bg-slate-800 dark:text-slate-400">
                                    {course.level}
                                </span>
                            )}
                        </div>

                        <h2 className="line-clamp-1 text-base font-bold text-slate-900 sm:text-lg dark:text-white">{course.title}</h2>

                        {course.next_material ? (
                            <p className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                                <span className="text-slate-400 dark:text-slate-500">Next lesson:</span>
                                <span className="flex items-center gap-1 font-medium text-purple-700 dark:text-purple-400">
                                    {course.next_material.content_type === 'video' ? <Video size={12} /> : <FileText size={12} />}
                                    {course.next_material.title}
                                </span>
                            </p>
                        ) : (
                            <p className="text-xs text-slate-500 dark:text-slate-400">Instructor: {course.creator?.name ?? 'KursusIO'}</p>
                        )}

                        <div className="flex items-center gap-3 pt-1">
                            <ProgressBar value={progress} className="h-2 w-36" />
                            <span className="text-xs font-bold text-purple-700 dark:text-purple-400">{progress}%</span>
                            <span className="hidden text-xs text-slate-400 sm:inline dark:text-slate-500">
                                ({course.completed_materials} of {course.total_materials} lessons)
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:shrink-0">
                    <Link
                        href={resumeUrl}
                        className="inline-flex w-full items-center justify-center gap-2 bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-600/20 transition hover:bg-purple-700 active:scale-98 sm:w-auto"
                    >
                        <Play size={14} className="fill-white" />
                        Continue Learning
                    </Link>
                </div>
            </div>
        </div>
    );
}
