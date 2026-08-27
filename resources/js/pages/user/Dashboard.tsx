import { Head, Link, usePage } from '@inertiajs/react';
import UserLayout from '@/components/templates/UserLayout';
import { BookOpen, CheckCircle, Clock, DollarSign, LayoutGrid, Sparkles, Star, TrendingUp, Users } from 'lucide-react';

export default function Dashboard() {
    const props = usePage().props as any;
    const role = props.auth.user.role;

    return (
        <>
            <Head title="Dashboard" />
            <div className="space-y-8">
                <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
                    <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
                    <div className="relative z-10">
                        <p className="mb-1 text-sm font-medium text-purple-300">Welcome back</p>
                        <h1 className="text-2xl font-bold sm:text-3xl">{props.auth.user.name}</h1>
                        <p className="mt-1 text-sm text-slate-400">
                            {role === 'instructor' ? 'See how your courses are performing.' : 'Continue learning from where you left off.'}
                        </p>
                    </div>
                </div>
                {role === 'instructor' ? <InstructorDashboard {...props} /> : <StudentDashboard {...props} />}
            </div>
        </>
    );
}

function InstructorDashboard({ instructorCourses = [], totalStudents = 0, totalEarnings = 0, averageRating = 0, recentEnrollments = [] }: any) {
    return (
        <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Stat icon={<LayoutGrid size={18} />} label="My Courses" value={instructorCourses.length} color="purple" />
                <Stat icon={<Users size={18} />} label="Total Students" value={totalStudents} color="indigo" />
                <Stat icon={<DollarSign size={18} />} label="Estimated Earnings" value={formatRupiah(totalEarnings)} color="emerald" compact />
                <Stat icon={<Star size={18} />} label="Average Rating" value={averageRating ? `${averageRating}/5` : '—'} color="amber" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <Section title="My Courses" description="Live enrollment totals for your courses.">
                    {instructorCourses.length ? (
                        instructorCourses.slice(0, 5).map((course: any) => (
                            <Link
                                key={course.id}
                                href={`/instructor/courses/${course.slug}`}
                                className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0 hover:text-purple-700"
                            >
                                <div>
                                    <p className="font-medium text-slate-700">{course.title}</p>
                                    <p className="mt-0.5 text-xs text-slate-400 capitalize">{course.status}</p>
                                </div>
                                <span className="text-sm font-semibold text-purple-700">{course.enrollments_count} students</span>
                            </Link>
                        ))
                    ) : (
                        <Empty text="You have not created a course yet." />
                    )}
                </Section>
                <Section title="Recent Enrollments" description="Students who recently joined your courses.">
                    {recentEnrollments.length ? (
                        recentEnrollments.map((enrollment: any) => (
                            <div key={enrollment.id} className="border-b border-slate-100 py-3 last:border-0">
                                <p className="font-medium text-slate-700">{enrollment.user?.name ?? 'Student'}</p>
                                <p className="mt-0.5 text-xs text-slate-400">
                                    Enrolled in {enrollment.course?.title ?? 'course'} · {formatDate(enrollment.enrolled_at)}
                                </p>
                            </div>
                        ))
                    ) : (
                        <Empty text="No enrollments yet." />
                    )}
                </Section>
            </div>
        </>
    );
}

function StudentDashboard({
    enrolledCourses = [],
    totalCompleted = 0,
    overallProgress = 0,
    completedMaterials = 0,
    learningMinutes = 0,
    recommendedCourses = [],
}: any) {
    return (
        <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Stat icon={<BookOpen size={18} />} label="Enrolled Courses" value={enrolledCourses.length} color="indigo" />
                <Stat icon={<CheckCircle size={18} />} label="Courses Completed" value={totalCompleted} color="emerald" />
                <Stat icon={<Clock size={18} />} label="Learning Time" value={`${Math.round(learningMinutes / 60)}h`} color="amber" />
                <Stat icon={<TrendingUp size={18} />} label="Overall Progress" value={`${overallProgress}%`} color="purple" />
            </div>

            <Section title="Continue Learning" description={`${completedMaterials} materials completed across your enrolled courses.`}>
                {enrolledCourses.length ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {enrolledCourses.map(({ course }: any) => (
                            <Link
                                key={course.id}
                                href={`/student/courses/${course.slug}`}
                                className="border border-slate-200 p-4 transition hover:border-purple-300 hover:shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <p className="font-semibold text-slate-800">{course.title}</p>
                                    <span className="text-sm font-bold text-purple-700">{course.progress_percent}%</span>
                                </div>
                                <div className="mt-4 h-2 overflow-hidden bg-slate-100">
                                    <div className="h-full bg-purple-600" style={{ width: `${course.progress_percent}%` }} />
                                </div>
                                <p className="mt-2 text-xs text-slate-400">
                                    {course.completed_materials} of {course.total_materials} materials completed
                                </p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <Empty text="You have not enrolled in a course yet." />
                )}
            </Section>

            {recommendedCourses && recommendedCourses.length > 0 && (
                <Section
                    title="Recommended for You"
                    description="Personalized course suggestions based on your learning activity and interests."
                >
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {recommendedCourses.map((course: any) => (
                            <Link
                                key={course.id}
                                href={`/course/${course.slug}`}
                                className="group flex flex-col border border-slate-200 bg-white transition hover:border-purple-300 hover:shadow-md"
                            >
                                <div className="aspect-video w-full overflow-hidden bg-slate-100 relative">
                                    <img
                                        src={course.thumbnail_url}
                                        alt={course.title}
                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                    />
                                    {course.recommendation_reason && (
                                        <div className="absolute top-2 left-2 bg-purple-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 flex items-center gap-1">
                                            <Sparkles size={11} className="text-amber-300" />
                                            <span>Recommended</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-1 flex-col justify-between p-3.5 space-y-2">
                                    <div>
                                        <p className="line-clamp-2 text-xs font-semibold text-slate-800 group-hover:text-purple-700">
                                            {course.title}
                                        </p>
                                        <p className="mt-1 text-[11px] text-slate-400">
                                            By {course.creator?.name ?? 'Instructor'}
                                        </p>
                                    </div>
                                    <div className="space-y-2 pt-1 border-t border-slate-100">
                                        <div className="flex flex-wrap gap-1">
                                            {course.tags?.slice(0, 2).map((t: any) => (
                                                <span key={t.id || t.name} className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5">
                                                    {t.name}
                                                </span>
                                            ))}
                                            {course.level && (
                                                <span className="bg-purple-50 text-purple-700 text-[10px] px-1.5 py-0.5 capitalize">
                                                    {course.level}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className={course.type === 'free' ? 'text-emerald-600' : 'text-slate-800'}>
                                                {course.type === 'free' ? 'FREE' : formatRupiah(course.price ?? 0)}
                                            </span>
                                            {course.rating_avg > 0 && (
                                                <span className="flex items-center gap-0.5 text-amber-600 text-[11px]">
                                                    <Star size={11} className="fill-amber-400 text-amber-400" />
                                                    {course.rating_avg}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </Section>
            )}
        </>
    );
}

function Stat({ icon, label, value, color, compact = false }: any) {
    const colors: any = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        purple: 'bg-purple-50 text-purple-600',
    };
    return (
        <div className="border border-slate-100 bg-white p-5 shadow-xs">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center ${colors[color]}`}>{icon}</div>
            <p className={`${compact ? 'text-lg' : 'text-2xl'} font-bold text-slate-800`}>{value}</p>
            <p className="mt-0.5 text-xs text-slate-400">{label}</p>
        </div>
    );
}
function Section({ title, description, children }: any) {
    return (
        <section className="border border-slate-100 bg-white p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-800">{title}</h2>
            <p className="mt-0.5 text-xs text-slate-400">{description}</p>
            <div className="mt-4">{children}</div>
        </section>
    );
}
function Empty({ text }: { text: string }) {
    return <div className="border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">{text}</div>;
}
function formatRupiah(value: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}
function formatDate(value?: string) {
    return value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value)) : 'Recently';
}

Dashboard.layout = (page: React.ReactNode) => <UserLayout>{page}</UserLayout>;
