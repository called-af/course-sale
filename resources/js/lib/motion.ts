import type { Variants } from 'motion/react';

/** Shared easing/spring so every landing interaction feels like one system. */
export const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

export const SOFT_SPRING = {
    type: 'spring',
    stiffness: 280,
    damping: 26,
    mass: 0.9,
} as const;

export const VIEWPORT_ONCE = {
    once: true,
    amount: 0.2,
} as const;

export function staggerContainer(staggerChildren = 0.08, delayChildren = 0.04): Variants {
    return {
        hidden: {},
        show: { transition: { staggerChildren, delayChildren } },
    };
}

export const riseIn: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export const cardIn: Variants = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

/** `initial={false}` is Motion's way of rendering the settled state for reduced motion. */
export function entrance<T>(reduceMotion: boolean | null | undefined, value: T): false | T {
    return reduceMotion ? false : value;
}
