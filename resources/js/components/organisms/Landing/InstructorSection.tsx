import { Link } from '@inertiajs/react';
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import { useEffect, useState } from 'react';

import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Title from '@/components/atoms/Title';
import LandingSectionHeader from '@/components/molecules/LandingSectionHeader';

interface Instructor {
    name: string;
    slug: string;
    role: string;
    bio: string;
    expertise: string[];
    courses: number;
    students: string;
}

/** Static content for now — will be replaced by real instructor data later. */
const INSTRUCTORS: Instructor[] = [
    {
        name: 'Andini Prameswari',
        slug: 'andini-prameswari',
        role: 'Senior Product Designer',
        bio: 'Led design teams at two unicorns and now teaches product design end to end, from research to handoff.',
        expertise: ['UI/UX', 'Design Systems'],
        courses: 8,
        students: '12,400',
    },
    {
        name: 'Bagas Nugroho',
        slug: 'bagas-nugroho',
        role: 'Full-stack Engineer',
        bio: 'Ten years building production apps with Laravel and React. Explains architecture in plain, practical language.',
        expertise: ['Laravel', 'React'],
        courses: 11,
        students: '18,900',
    },
    {
        name: 'Citra Halimah',
        slug: 'citra-halimah',
        role: 'Growth Marketing Lead',
        bio: 'Helped early-stage startups scale from zero to their first hundred thousand users with content and paid ads.',
        expertise: ['SEO', 'Performance Ads'],
        courses: 6,
        students: '9,700',
    },
    {
        name: 'Dimas Saputra',
        slug: 'dimas-saputra',
        role: 'Data Scientist',
        bio: 'Works on recommendation systems daily and mentors learners transitioning into data careers.',
        expertise: ['Python', 'Machine Learning'],
        courses: 5,
        students: '7,300',
    },
];

const AUTOPLAY_MS = 6000;

const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

const textVariants: Variants = {
    enter: (direction: number) => ({ opacity: 0, y: direction >= 0 ? 18 : -18 }),
    center: { opacity: 1, y: 0 },
    exit: (direction: number) => ({ opacity: 0, y: direction >= 0 ? -18 : 18 }),
};

const imageVariants: Variants = {
    enter: (direction: number) => ({ opacity: 0, scale: 1.05, x: direction >= 0 ? 24 : -24 }),
    center: { opacity: 1, scale: 1, x: 0 },
    exit: (direction: number) => ({ opacity: 0, scale: 0.98, x: direction >= 0 ? -24 : 24 }),
};

function initialsOf(name: string) {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('');
}

export default function InstructorSection() {
    const reduceMotion = useReducedMotion();
    const [[activeIndex, direction], setPage] = useState<[number, number]>([0, 0]);
    const [paused, setPaused] = useState(false);

    const paginate = (step: number) => {
        setPage(([index]) => [(index + step + INSTRUCTORS.length) % INSTRUCTORS.length, step]);
    };

    // Auto-advance to the next instructor every few seconds (paused on hover).
    useEffect(() => {
        if (reduceMotion || paused) {
            return;
        }

        const timer = window.setInterval(() => {
            setPage(([index]) => [(index + 1) % INSTRUCTORS.length, 1]);
        }, AUTOPLAY_MS);

        return () => window.clearInterval(timer);
    }, [reduceMotion, paused, activeIndex]);

    const instructor = INSTRUCTORS[activeIndex];

    return (
        <section id="instructors" className="relative overflow-hidden bg-gray-100 py-24 dark:bg-[#141416]">
            <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
                <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
                    {/* Left — heading + active instructor details */}
                    <div className="flex flex-col gap-7">
                        <motion.div
                            initial={reduceMotion ? false : { opacity: 0, x: -32 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.7, ease: EASE }}
                        >
                            <LandingSectionHeader
                                badge="Instructors"
                                titleLead="Learn From "
                                titleHighlight="Practitioners"
                                description="Every course is taught by someone who does the work, not just talks about it."
                            />
                        </motion.div>

                        <div className="min-h-[220px]">
                            <AnimatePresence mode="wait" initial={false} custom={direction}>
                                <motion.div
                                    key={instructor.slug}
                                    custom={direction}
                                    variants={textVariants}
                                    initial={reduceMotion ? false : 'enter'}
                                    animate="center"
                                    exit={reduceMotion ? undefined : 'exit'}
                                    transition={{ duration: 0.4, ease: EASE }}
                                    className="flex flex-col gap-4"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="h-2 w-2 rounded-full bg-purple-500" />
                                        <span className="text-[11px] font-semibold tracking-[0.18em] text-purple-600 uppercase dark:text-purple-400">
                                            {instructor.role}
                                        </span>
                                    </div>

                                    <Title as="h3" className="text-2xl text-gray-900 sm:text-3xl dark:text-white">
                                        {instructor.name}
                                    </Title>

                                    <p className="max-w-md text-sm leading-relaxed text-gray-500 dark:text-slate-400">{instructor.bio}</p>

                                    <div className="flex flex-wrap gap-1.5">
                                        {instructor.expertise.map((skill) => (
                                            <Badge key={skill}>{skill}</Badge>
                                        ))}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-gray-400 dark:text-slate-500">
                                        <span className="inline-flex items-center gap-1.5">
                                            <BookOpen size={13} />
                                            {instructor.courses} courses
                                        </span>
                                        <span className="inline-flex items-center gap-1.5">
                                            <Users size={13} />
                                            {instructor.students} students
                                        </span>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div>
                            <Link href="/course">
                                <Button variant="outline" rightIcon={<ArrowRight size={16} />} className="px-6 py-2.5">
                                    Browse all instructors
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Right — big image with overlaid controls */}
                    <motion.div
                        initial={reduceMotion ? false : { opacity: 0, y: 32 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
                        onPointerEnter={() => setPaused(true)}
                        onPointerLeave={() => setPaused(false)}
                        className="relative"
                    >
                        <motion.div
                            drag={reduceMotion ? false : 'x'}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.18}
                            onDragEnd={(_, info) => {
                                if (info.offset.x < -80 || info.velocity.x < -500) {
                                    paginate(1);
                                } else if (info.offset.x > 80 || info.velocity.x > 500) {
                                    paginate(-1);
                                }
                            }}
                            className="relative aspect-[5/4] w-full cursor-grab overflow-hidden border border-slate-200/80 bg-gradient-to-br from-purple-200 via-purple-100 to-indigo-200 shadow-sm active:cursor-grabbing dark:border-slate-700 dark:from-purple-900/60 dark:via-[#1e1f24] dark:to-indigo-900/50"
                        >
                            <AnimatePresence initial={false} custom={direction}>
                                <motion.div
                                    key={instructor.slug}
                                    custom={direction}
                                    variants={imageVariants}
                                    initial={reduceMotion ? false : 'enter'}
                                    animate="center"
                                    exit={reduceMotion ? undefined : 'exit'}
                                    transition={{ duration: 0.45, ease: EASE }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <span
                                        aria-hidden
                                        className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_25%,rgba(255,255,255,0.55),transparent_70%)] dark:bg-[radial-gradient(60%_60%_at_50%_25%,rgba(255,255,255,0.08),transparent_70%)]"
                                    />
                                    <span className="relative font-display text-[8rem] leading-none text-purple-700/80 select-none sm:text-[11rem] dark:text-purple-200/80">
                                        {initialsOf(instructor.name)}
                                    </span>
                                </motion.div>
                            </AnimatePresence>

                            {/* Label */}
                            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-white/80 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-purple-700 uppercase backdrop-blur-sm dark:bg-[#141416]/80 dark:text-purple-300">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-500" />
                                Instructor
                            </span>

                            {/* Prev / next arrows overlaid on the image */}
                            <button
                                type="button"
                                onClick={() => paginate(-1)}
                                aria-label="Previous instructor"
                                className="absolute top-1/2 left-4 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                type="button"
                                onClick={() => paginate(1)}
                                aria-label="Next instructor"
                                className="absolute top-1/2 right-4 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                            >
                                <ChevronRight size={20} />
                            </button>

                            {/* Dots — bottom right of the image */}
                            <div className="absolute right-4 bottom-4 z-10 flex items-center gap-2">
                                {INSTRUCTORS.map((item, index) => (
                                    <button
                                        key={item.slug}
                                        type="button"
                                        onClick={() => setPage([index, index >= activeIndex ? 1 : -1])}
                                        aria-label={`Go to instructor ${index + 1}: ${item.name}`}
                                        aria-current={index === activeIndex}
                                        className={`h-2 rounded-full transition-colors duration-300 ${
                                            index === activeIndex ? 'w-6 bg-purple-500' : 'w-2 bg-white/60 hover:bg-white'
                                        }`}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
