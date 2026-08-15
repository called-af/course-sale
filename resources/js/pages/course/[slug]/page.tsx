import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, BookOpen, CheckCircle2, Clock3, GraduationCap, Layers, UserRound } from 'lucide-react';
import { useState } from 'react';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import WelcomeLayout from '@/components/templates/WelcomeLayout';
import { Course } from '@/types';

interface CourseDetailPageProps {
    course: Course;
    isEnrolled: boolean;
}

export default function CourseDetailPage({ course, isEnrolled }: CourseDetailPageProps) {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const [processing, setProcessing] = useState(false);

    const enroll = () => {
        setProcessing(true);
        router.post(
            `/course/${course.slug}/enroll`,
            {},
            {
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <>
            <Head title={course.title} />

            <div className="min-h-screen bg-[#FAFAF8] pt-24 pb-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-8">
                    <Link
                        href="/course"
                        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-purple-700"
                    >
                        <ArrowLeft size={17} />
                        Back to courses
                    </Link>

                    <div className="grid gap-8 lg:grid-cols-3">
                        <section className="space-y-7 lg:col-span-2">
                            <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
                                <img src={course.thumbnail_url} alt={course.title} className="aspect-video w-full object-cover" />
                            </div>

                            <div className="space-y-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    {course.categories?.map((category) => (
                                        <Badge key={category.id} variant="purple">
                                            {category.name}
                                        </Badge>
                                    ))}
                                    {course.level && <Badge>{course.level}</Badge>}
                                </div>

                                <div>
                                    <p className="mb-2 text-sm font-medium text-purple-700">Course</p>
                                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{course.title}</h1>
                                    <p className="mt-4 leading-relaxed whitespace-pre-line text-slate-600">
                                        {course.description || 'Course description is not available yet.'}
                                    </p>
                                </div>

                                <div className="grid gap-4 border-y border-slate-200 py-5 sm:grid-cols-3">
                                    <CourseInfo icon={<UserRound size={18} />} label="Instructor" value={course.creator?.name || '—'} />
                                    <CourseInfo icon={<Layers size={18} />} label="Level" value={course.level || 'All levels'} />
                                    <CourseInfo icon={<Clock3 size={18} />} label="Access" value="Learn at your pace" />
                                </div>
                            </div>
                        </section>

                        <aside className="h-fit border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
                            <p className="text-sm font-medium text-slate-500">Course access</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">
                                {course.type === 'free' ? 'Free' : `Rp ${Number(course.price ?? 0).toLocaleString('id-ID')}`}
                            </p>
                            <div className="my-5 border-t border-slate-100" />

                            {isEnrolled ? (
                                <Link href={`/student/courses/${course.slug}`} className="block">
                                    <Button widthFull leftIcon={<GraduationCap size={18} />}>
                                        Continue Learning
                                    </Button>
                                </Link>
                            ) : user?.role === 'student' ? (
                                <Button widthFull onClick={enroll} isLoading={processing} leftIcon={<BookOpen size={18} />}>
                                    {course.type === 'free' ? 'Enroll Now' : 'Buy Course'}
                                </Button>
                            ) : !user ? (
                                <Link href="/login" className="block">
                                    <Button widthFull leftIcon={<BookOpen size={18} />}>
                                        Sign in to enroll
                                    </Button>
                                </Link>
                            ) : null}

                            <div className="mt-5 space-y-3 text-sm text-slate-600">
                                <p className="flex items-center gap-2">
                                    <CheckCircle2 size={17} className="text-emerald-600" /> Full course access after enrollment
                                </p>
                                <p className="flex items-center gap-2">
                                    <CheckCircle2 size={17} className="text-emerald-600" /> Learn anytime, at your own pace
                                </p>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </>
    );
}

function CourseInfo({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="text-purple-700">{icon}</div>
            <div>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-medium text-slate-700">{value}</p>
            </div>
        </div>
    );
}

CourseDetailPage.layout = (page: React.ReactNode) => <WelcomeLayout>{page}</WelcomeLayout>;
