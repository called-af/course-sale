import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useScroll, useSpring, useVelocity } from 'motion/react';
import { useEffect, useRef } from 'react';

interface MarqueeLineProps {
    text: string;
    repeat?: number;
    /** How strongly scroll velocity pushes the line. */
    speed?: number;
    reverse?: boolean;
    /** Constant drift in px/s when the page is still. */
    drift?: number;
    /** Rotation in degrees, so the line can follow a slanted section edge. */
    tilt?: number;
    className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Time-driven marquee with scroll inertia and a soft hover slowdown.
 * Uses two identical sets and wraps inside one set width, so the loop is seamless.
 */
export default function MarqueeLine({ text, repeat = 20, speed = 0.6, reverse = false, drift = 24, tilt = 0, className }: MarqueeLineProps) {
    const reduceMotion = useReducedMotion();
    const { scrollY } = useScroll();

    const scrollVelocity = useVelocity(scrollY);
    const smoothScrollVelocity = useSpring(scrollVelocity, {
        stiffness: 140,
        damping: 26,
        restDelta: 1,
    });

    const x = useMotionValue(0);
    const trackRef = useRef<HTMLDivElement>(null);
    const setWidth = useRef(0);
    const initialized = useRef(false);
    const velocity = useRef(0);
    const hovered = useRef(false);
    const direction = reverse ? 1 : -1;

    useEffect(() => {
        const firstSet = trackRef.current?.firstElementChild;

        const measure = () => {
            const next = firstSet instanceof HTMLElement ? firstSet.clientWidth : 0;
            if (!next) return;

            const previous = setWidth.current;

            if (previous > 0 && initialized.current) {
                // Preserve the visual phase when the text width changes (font load / resize).
                const phase = ((((x.get() + previous) % previous) + previous) % previous) / previous;
                x.set(-next + phase * next);
            } else {
                x.set(reduceMotion ? 0 : -next);
                initialized.current = true;
            }

            setWidth.current = next;
        };

        measure();
        document.fonts?.ready.then(measure).catch(() => undefined);

        const observer = firstSet ? new ResizeObserver(measure) : null;
        if (firstSet) observer?.observe(firstSet);

        window.addEventListener('resize', measure);
        return () => {
            observer?.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, [reduceMotion, x]);

    useAnimationFrame((_, delta) => {
        if (reduceMotion || !setWidth.current || delta <= 0) return;

        // Cap dt so returning to a background tab doesn't teleport the line.
        const dt = Math.min(delta, 50) / 1000;
        const scrollBoost = clamp(smoothScrollVelocity.get() * speed, -1800, 1800);
        const target = (drift + scrollBoost) * direction * (hovered.current ? 0.18 : 1);

        // Frame-rate independent easing towards the target velocity.
        const blend = 1 - Math.exp(-dt / 0.16);
        velocity.current += (target - velocity.current) * blend;

        const raw = x.get() + velocity.current * dt;
        const width = setWidth.current;
        x.set((((raw % width) + width) % width) - width);
    });

    return (
        <div
            aria-hidden
            className={['relative flex overflow-hidden select-none', className].join(' ')}
            onPointerEnter={() => {
                hovered.current = true;
            }}
            onPointerLeave={() => {
                hovered.current = false;
            }}
            style={{
                transform: `rotate(${tilt}deg)`,
                maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            }}
        >
            <motion.div ref={trackRef} className="flex w-max shrink-0" style={{ x, willChange: 'transform' }}>
                {[0, 1].map((set) => (
                    <div key={set} className="flex shrink-0 items-center">
                        {Array.from({ length: repeat }).map((_, index) => (
                            <span
                                key={index}
                                className={[
                                    'pr-10 font-display text-[clamp(2rem,5vw,4rem)] leading-none whitespace-nowrap uppercase sm:pr-14 lg:pr-16',
                                    index % 2 === 0 ? 'text-white' : 'text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.22)]',
                                ].join(' ')}
                            >
                                {text}
                            </span>
                        ))}
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
