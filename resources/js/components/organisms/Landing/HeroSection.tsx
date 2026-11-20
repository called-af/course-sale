import { Link } from '@inertiajs/react';
import { ArrowRight, Play } from 'lucide-react';
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import type { Variants } from 'motion/react';
import { useRef } from 'react';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Title from '@/components/atoms/Title';
import { useLanding } from '@/hooks/useLanding';
import { EASE, entrance } from '@/lib/motion';

const PHOTO_SPANS = ['col-span-2 row-span-2', 'col-span-1 row-span-1', 'col-span-1 row-span-1', 'col-span-1 row-span-1', 'col-span-2 row-span-1'];

const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.12 } },
};

const item: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
    if (href.startsWith('#') || href.startsWith('http')) {
        return (
            <a href={href} className="inline-flex w-full lg:w-auto">
                {children}
            </a>
        );
    }

    return (
        <Link href={href} className="inline-flex w-full lg:w-auto">
            {children}
        </Link>
    );
}

const BentoGrid = ({ rowHeight, photos }: { rowHeight: number; photos: string[] }) => {
    const reduceMotion = useReducedMotion();

    return (
        <div
            className="grid w-full gap-1.5"
            style={{
                gridTemplateColumns: 'repeat(3, 1fr)',
                gridTemplateRows: `repeat(3, ${rowHeight}px)`,
            }}
        >
            {photos.map((src, index) => (
                <motion.div
                    key={`${src}-${index}`}
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 18 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 + index * 0.09, ease: EASE }}
                    className={`${PHOTO_SPANS[index] ?? 'col-span-1 row-span-1'} group relative overflow-hidden`}
                >
                    <motion.img
                        src={src}
                        alt=""
                        whileHover={reduceMotion ? undefined : { scale: 1.06 }}
                        transition={{ duration: 0.6, ease: EASE }}
                        className="h-full w-full object-cover"
                    />
                    <span aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-black/10 ring-inset dark:ring-white/10" />
                </motion.div>
            ))}
        </div>
    );
};

export default function HeroSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const reduceMotion = useReducedMotion();
    const { hero } = useLanding();

    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 90,
        damping: 24,
        restDelta: 0.001,
        skipInitialAnimation: true,
    });
    const still = useMotionValue(0);
    const farGlowY = useTransform(smoothProgress, [0, 1], [0, 90]);
    const nearGlowY = useTransform(smoothProgress, [0, 1], [0, -70]);
    const gridY = useTransform(smoothProgress, [0, 1], [0, -42]);

    const farY = reduceMotion ? still : farGlowY;
    const nearY = reduceMotion ? still : nearGlowY;
    const bentoY = reduceMotion ? still : gridY;

    return (
        <section ref={sectionRef} className="relative min-h-screen overflow-hidden bg-gray-100 dark:bg-[#141416]">
            {/* Ambient glows */}
            <motion.div
                aria-hidden
                style={{ y: farY }}
                className="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full bg-purple-400/10 blur-3xl dark:bg-purple-500/10"
            />
            <motion.div
                aria-hidden
                style={{ y: nearY }}
                className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-indigo-300/10 blur-3xl dark:bg-indigo-500/5"
            />

            <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-between px-4 sm:px-8">
                <motion.div
                    variants={container}
                    initial={reduceMotion ? false : 'hidden'}
                    animate="show"
                    className="flex w-full max-w-xl min-w-0 flex-1 flex-col gap-6 py-20 lg:py-0"
                >
                    <motion.div variants={item}>
                        <Badge variant="purple" dot>
                            {hero.badge}
                        </Badge>
                    </motion.div>

                    <motion.div variants={item}>
                        <motion.div
                            initial={entrance(reduceMotion, { clipPath: 'inset(0 0 100% 0)', y: 14 })}
                            animate={{ clipPath: 'inset(0 0 0% 0)', y: 0 }}
                            transition={{ duration: 0.75, delay: 0.12, ease: EASE }}
                        >
                            <Title as="h1" className="leading-none" style={{ fontSize: 'clamp(2.8rem,6vw,5rem)', lineHeight: 1.05 }}>
                                {hero.title_lead}
                            </Title>
                        </motion.div>
                        <motion.div
                            initial={entrance(reduceMotion, { clipPath: 'inset(0 0 100% 0)', y: 14 })}
                            animate={{ clipPath: 'inset(0 0 0% 0)', y: 0 }}
                            transition={{ duration: 0.75, delay: 0.22, ease: EASE }}
                        >
                            <Title
                                as="h1"
                                className="relative isolate mt-1 inline-block bg-purple-400 px-2 leading-none"
                                style={{ fontSize: 'clamp(2.8rem,6vw,5rem)', lineHeight: 1.1 }}
                            >
                                <span
                                    aria-hidden
                                    className="pointer-events-none absolute -inset-x-8 -inset-y-4 -z-10 rounded-full bg-purple-400/30 blur-2xl dark:bg-purple-500/25"
                                />
                                {hero.title_highlight}
                            </Title>
                        </motion.div>
                    </motion.div>

                    <motion.div variants={item} className="w-full overflow-hidden lg:hidden">
                        <BentoGrid rowHeight={90} photos={hero.photos} />
                    </motion.div>

                    <motion.p variants={item} className="max-w-lg text-sm leading-relaxed text-gray-500 lg:text-lg dark:text-slate-400">
                        {hero.subtitle}
                    </motion.p>

                    <motion.div variants={item} className="flex flex-col items-center gap-4 lg:flex-row">
                        <motion.div
                            whileHover={reduceMotion ? undefined : { y: -2 }}
                            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                            className="w-full lg:w-auto"
                        >
                            <ActionLink href={hero.primary_href}>
                                <Button
                                    widthFull
                                    variant="primary"
                                    rightIcon={<ArrowRight size={18} />}
                                    className="bg-[#141416] px-8 py-3 text-base hover:bg-gray-700 focus:ring-gray-500"
                                >
                                    {hero.primary_label}
                                </Button>
                            </ActionLink>
                        </motion.div>

                        <motion.div
                            whileHover={reduceMotion ? undefined : { y: -2 }}
                            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                            className="w-full lg:w-auto"
                        >
                            <ActionLink href={hero.secondary_href}>
                                <Button widthFull variant="outline" leftIcon={<Play size={18} />} className="px-6 py-3 text-base">
                                    {hero.secondary_label}
                                </Button>
                            </ActionLink>
                        </motion.div>
                    </motion.div>

                    <motion.div variants={item} className="flex w-fit items-center gap-6 border-t border-gray-200 pt-8 dark:border-slate-700">
                        <div className="flex items-center">
                            {hero.avatars.map((src, index) => (
                                <motion.img
                                    key={`${src}-${index}`}
                                    src={src}
                                    alt=""
                                    initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.45, delay: 0.7 + index * 0.08, ease: EASE }}
                                    whileHover={reduceMotion ? undefined : { y: -3, zIndex: 10 }}
                                    className="h-9 w-9 rounded-full object-cover ring-2 ring-white dark:ring-slate-900"
                                    style={{ marginLeft: index === 0 ? 0 : '-10px' }}
                                />
                            ))}
                        </div>
                        <div>
                            <div className="flex items-center gap-1 text-sm text-amber-400">
                                {'★★★★★'}
                                <span className="ml-1 font-semibold text-gray-900 dark:text-white">{hero.rating}</span>
                            </div>
                            <div className="mt-0.5 text-xs text-gray-400 dark:text-slate-500">
                                from <span className="font-medium text-gray-700 dark:text-slate-300">{hero.learners_label}</span>{' '}
                                {hero.learners_suffix}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                <motion.div style={{ y: bentoY }} className="relative hidden max-w-lg flex-1 lg:block">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -inset-6 -z-10 bg-[radial-gradient(60%_60%_at_60%_40%,color-mix(in_srgb,var(--color-purple-500)_14%,transparent),transparent_75%)] blur-2xl"
                    />
                    <BentoGrid rowHeight={160} photos={hero.photos} />

                    <motion.div
                        initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.85, ease: EASE }}
                        className="absolute -bottom-5 -left-5 flex items-center gap-3 bg-white px-4 py-3 shadow-xl dark:bg-[#1e1f24]"
                    >
                        <span className="font-display text-2xl leading-none text-gray-900 dark:text-white">{hero.learners_label}</span>
                        <span className="text-[11px] leading-tight text-gray-500 dark:text-slate-400">
                            {hero.learners_suffix}
                            <br />
                            and growing
                        </span>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
