import { Link } from '@inertiajs/react';
import { Award, Compass, Sparkles } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { useBranding } from '@/hooks/useBranding';
import { getGreeting } from '@/lib/dashboard';

interface StudentHeroProps {
    userName: string;
    enrolledCount: number;
    activeCourseTitle?: string;
}

export default function StudentHero({ userName, enrolledCount, activeCourseTitle }: StudentHeroProps) {
    const { name } = useBranding();
    const description =
        enrolledCount === 0
            ? `Welcome to ${name}! Explore the course catalog and start your new learning journey today.`
            : activeCourseTitle
              ? `You have active learning progress in "${activeCourseTitle}". Continue the lessons to complete the course!`
              : 'Great job! You have completed all your enrolled courses. Keep improving your skills with new courses.';

    return (
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
            <div className="pointer-events-none absolute -top-12 -right-12 h-64 w-64 bg-purple-500/20 blur-3xl" />
            <div className="pointer-events-none absolute right-1/4 -bottom-16 h-56 w-56 bg-indigo-500/15 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-200 backdrop-blur-xs">
                            <Sparkles size={12} className="text-amber-300" />
                            {getGreeting()}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{userName}</h1>
                    <p className="text-sm leading-relaxed text-slate-300 sm:text-base">{description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                    <Link href="/course">
                        <Button size="sm" leftIcon={<Compass size={14} />} className="!rounded-none">
                            Explore Courses
                        </Button>
                    </Link>
                    <Link href="/student/certificates">
                        <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Award size={14} className="text-purple-300" />}
                            className="!rounded-none !border-white/20 !bg-white/10 !text-white backdrop-blur-xs hover:!border-white/30 hover:!bg-white/20 dark:!border-white/20 dark:!bg-white/10 dark:!text-white dark:hover:!border-white/30 dark:hover:!bg-white/20"
                        >
                            My Certificates
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
