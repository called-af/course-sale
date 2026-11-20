import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import { useEffect, useState } from 'react';

import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Title from '@/components/atoms/Title';
import LandingSectionHeader from '@/components/molecules/LandingSectionHeader';
import SectionLink from '@/components/molecules/SectionLink';
import { useLanding } from '@/hooks/useLanding';

import type { LandingInstructor } from '@/types';

interface Props {
    instructors: LandingInstructor[];
}

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
    const initials = name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('');

    return initials || '?';
}

function InstructorPortrait({ instructor, direction, reduceMotion }: { instructor: LandingInstructor; direction: number; reduceMotion: boolean }) {
    const [failed, setFailed] = useState(false);
    const photo = instructor.avatar_url;

    useEffect(() => setFailed(false), [photo]);

    return (
        <motion.div
            key={instructor.slug}
            custom={direction}
            variants={imageVariants}
            initial={reduceMotion ? false : 'enter'}
            animate="center"
            exit={reduceMotion ? undefined : 'exit'}
            transition={{ type: 'spring', visualDuration: 0.48, bounce: 0.1 }}
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-200 via-purple-100 to-indigo-200 dark:from-purple-900/60 dark:via-[#1e1f24] dark:to-indigo-900/50"
        >
            {photo && !failed ? (
                <motion.img
                    key={photo}
                    src={photo}
                    alt={instructor.name}
                    initial={{ opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: EASE }}
                    onError={() => setFailed(true)}
                    className="h-full w-full object-cover"
                />
            ) : (
                <span className="relative font-display text-[8rem] leading-none text-purple-700/80 select-none sm:text-[11rem] dark:text-purple-200/80">
                    {initialsOf(instructor.name)}
                </span>
            )}

            <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_25%,rgba(255,255,255,0.4),transparent_70%)] dark:bg-[radial-gradient(60%_60%_at_50%_25%,rgba(255,255,255,0.08),transparent_70%)]"
            />
        </motion.div>
    );
}

export default function InstructorSection({ instructors }: Props) {
    const reduceMotion = useReducedMotion();
    const { instructor: copy } = useLanding();
    const [[activeIndex, direction], setPage] = useState<[number, number]>([0, 0]);
    const [paused, setPaused] = useState(false);

    const count = instructors.length;
    const canCycle = count > 1;

    const paginate = (step: number) => {
        if (!canCycle) {
            return;
        }

        setPage(([index]) => [(index + step + count) % count, step]);
    };

    // Keep the active slide in range when the admin changes the selection.
    useEffect(() => {
        if (count > 0 && activeIndex >= count) {
            setPage([0, 0]);
        }
    }, [activeIndex, count]);

    // Auto-advance between real instructors, paused on hover.
    useEffect(() => {
        if (reduceMotion || paused || !canCycle) {
            return;
        }

        const timer = window.setInterval(() => {
            setPage(([index]) => [(index + 1) % count, 1]);
        }, AUTOPLAY_MS);

        return () => window.clearInterval(timer);
    }, [reduceMotion, paused, canCycle, count]);

    const instructor = instructors[activeIndex] ?? instructors[0];

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
                                badge={copy.badge}
                                titleLead={copy.title_lead}
                                titleHighlight={copy.title_highlight}
                                description={copy.description}
                            />
                        </motion.div>

                        {instructor ? (
                            <>
                                <div className="min-h-[220px]">
                                    <AnimatePresence mode="wait" initial={false} custom={direction}>
                                        <motion.div
                                            key={instructor.slug}
                                            custom={direction}
                                            variants={textVariants}
                                            initial={reduceMotion ? false : 'enter'}
                                            animate="center"
                                            exit={reduceMotion ? undefined : 'exit'}
                                            transition={{ type: 'spring', visualDuration: 0.42, bounce: 0.12 }}
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

                                            {instructor.expertise.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {instructor.expertise.map((skill) => (
                                                        <Badge key={skill}>{skill}</Badge>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-gray-400 dark:text-slate-500">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <BookOpen size={13} />
                                                    {instructor.courses} course{instructor.courses === 1 ? '' : 's'}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Users size={13} />
                                                    {instructor.students_label} student{instructor.students === 1 ? '' : 's'}
                                                </span>
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                <div>
                                    <SectionLink href={copy.cta_href}>
                                        <Button variant="outline" rightIcon={<ArrowRight size={16} />} className="px-6 py-2.5">
                                            {copy.cta_label}
                                        </Button>
                                    </SectionLink>
                                </div>
                            </>
                        ) : (
                            <div className="border border-dashed border-slate-300 bg-white/60 p-8 text-sm text-gray-500 dark:border-slate-700 dark:bg-[#1e1f24]/60 dark:text-slate-400">
                                No instructors have been published yet. Add an instructor account to fill this section.
                            </div>
                        )}
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
                            drag={reduceMotion || !canCycle ? false : 'x'}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.18}
                            onDragEnd={(_, info) => {
                                if (info.offset.x < -80 || info.velocity.x < -500) {
                                    paginate(1);
                                } else if (info.offset.x > 80 || info.velocity.x > 500) {
                                    paginate(-1);
                                }
                            }}
                            className={`relative aspect-[5/4] w-full overflow-hidden border border-slate-200/80 bg-gradient-to-br from-purple-200 via-purple-100 to-indigo-200 shadow-sm dark:border-slate-700 dark:from-purple-900/60 dark:via-[#1e1f24] dark:to-indigo-900/50 ${
                                canCycle ? 'cursor-grab active:cursor-grabbing' : ''
                            }`}
                        >
                            <AnimatePresence initial={false} custom={direction} mode="wait">
                                {instructor && (
                                    <InstructorPortrait instructor={instructor} direction={direction} reduceMotion={Boolean(reduceMotion)} />
                                )}
                            </AnimatePresence>

                            {!instructor && (
                                <div className="absolute inset-0 flex items-center justify-center text-sm text-purple-700/60 dark:text-purple-200/60">
                                    Instructor photo
                                </div>
                            )}

                            {instructor && (
                                <>
                                    <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-white/80 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-purple-700 uppercase backdrop-blur-sm dark:bg-[#141416]/80 dark:text-purple-300">
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-500" />
                                        Instructor
                                    </span>

                                    {canCycle && (
                                        <>
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

                                            {!reduceMotion && !paused && (
                                                <motion.span
                                                    key={instructor.slug}
                                                    aria-hidden
                                                    initial={{ scaleX: 0 }}
                                                    animate={{ scaleX: 1 }}
                                                    transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
                                                    className="absolute inset-x-4 bottom-0 h-0.5 origin-left bg-purple-500/80"
                                                />
                                            )}

                                            <div className="absolute right-4 bottom-4 z-10 flex items-center gap-2">
                                                {instructors.map((item, index) => (
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
                                        </>
                                    )}
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
