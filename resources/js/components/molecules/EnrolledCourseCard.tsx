import { Link } from '@inertiajs/react';
import { CheckCircle, Download, Play } from 'lucide-react';
import ProgressBar from '@/components/atoms/ProgressBar';
import type { ContinueLearningCourse } from '@/types/dashboard';

interface EnrolledCourseCardProps {
    course: ContinueLearningCourse;
}

export default function EnrolledCourseCard({ course }: EnrolledCourseCardProps) {
    const progress = course.progress_percent ?? 0;
    const isCompleted = progress === 100;
    const resumeUrl = `/student/courses/${course.slug}${
        course.next_material
            ? `?material=${course.next_material.id}${course.next_material.content_id ? `&content=${course.next_material.content_id}` : ''}`
            : ''
    }`;

    return (
        <div className="group flex flex-col justify-between overflow-hidden border border-slate-200 bg-white transition-all duration-200 hover:border-purple-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-purple-800">
            <div>
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                        src={course.thumbnail_url ?? '/assets/landscape.jpeg'}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    <div className="absolute top-2.5 left-2.5">
                        {isCompleted ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                <CheckCircle size={10} />
                                100% Complete
                            </span>
                        ) : progress > 0 ? (
                            <span className="inline-flex items-center gap-1 bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                <Play size={9} className="fill-white" />
                                In Progress
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 bg-slate-700/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                                Not Started
                            </span>
                        )}
                    </div>

                    {course.level && (
                        <span className="absolute top-2.5 right-2.5 bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white capitalize backdrop-blur-xs">
                            {course.level}
                        </span>
                    )}

                    <div className="absolute right-2.5 bottom-2.5 bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-xs">
                        {progress}%
                    </div>
                </div>

                <div className="space-y-3 p-4">
                    <div>
                        <h3 className="line-clamp-2 text-sm font-bold text-slate-800 group-hover:text-purple-700 dark:text-slate-100 dark:group-hover:text-purple-400">
                            {course.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">By {course.creator?.name ?? 'KursusIO'}</p>
                    </div>

                    <div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>Learning Progress</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                                {course.completed_materials} / {course.total_materials} lessons
                            </span>
                        </div>
                        <ProgressBar
                            value={progress}
                            tone={isCompleted ? 'emerald' : 'purple'}
                            className="mt-1.5"
                            barClassName={isCompleted ? 'bg-emerald-500' : 'bg-purple-600'}
                        />
                    </div>

                    {!isCompleted && course.next_material && (
                        <div className="bg-purple-50/70 p-2 text-[11px] dark:bg-purple-950/40">
                            <span className="text-slate-400 dark:text-slate-500">Up next: </span>
                            <span className="line-clamp-1 font-semibold text-purple-700 dark:text-purple-300">{course.next_material.title}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-slate-100 p-4 pt-3 dark:border-slate-800">
                <Link
                    href={`/course/${course.slug}`}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                    Course Details
                </Link>

                {isCompleted ? (
                    <div className="flex items-center gap-1.5">
                        {course.certificate && (
                            <a
                                href={`/student/certificates/${course.certificate.id}/download`}
                                className="inline-flex items-center gap-1 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                            >
                                <Download size={12} />
                                Download Certificate
                            </a>
                        )}
                        <Link
                            href={`/course/${course.slug}`}
                            title="Open the lesson viewer to review the course materials"
                            className="inline-flex items-center gap-1 bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-purple-700"
                        >
                            <Play size={10} className="fill-white" />
                            Review Lessons
                        </Link>
                    </div>
                ) : (
                    <Link
                        href={resumeUrl}
                        className="inline-flex items-center gap-1 bg-purple-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-purple-700 active:scale-98"
                    >
                        <Play size={11} className="fill-white" />
                        {progress > 0 ? 'Continue Learning' : 'Start Learning'}
                    </Link>
                )}
            </div>
        </div>
    );
}
