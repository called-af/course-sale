import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useScroll } from 'motion/react';
import { useEffect, useRef } from 'react';

interface MarqueeLineProps {
    text: string;
    repeat?: number;
    /** Pixels the line travels for every pixel scrolled. */
    speed?: number;
    reverse?: boolean;
    /** Rotation in degrees, so the line can follow a slanted section edge. */
    tilt?: number;
    className?: string;
}

export default function MarqueeLine({ text, repeat = 20, speed = 0.6, reverse = false, tilt = 0, className }: MarqueeLineProps) {
    const reduceMotion = useReducedMotion();
    const { scrollY } = useScroll();
    const x = useMotionValue(0);
    const trackRef = useRef<HTMLDivElement>(null);
    const setWidth = useRef(0);
    const lastScroll = useRef<number | null>(null);

    useEffect(() => {
        const firstSet = trackRef.current?.firstElementChild;

        const measure = () => {
            setWidth.current = firstSet instanceof HTMLElement ? firstSet.clientWidth : 0;
        };

        measure();
        document.fonts?.ready.then(measure).catch(() => undefined);

        const observer = firstSet ? new ResizeObserver(measure) : null;
        if (firstSet) {
            observer?.observe(firstSet);
        }

        window.addEventListener('resize', measure);
        return () => {
            observer?.disconnect();
            window.removeEventListener('resize', measure);
        };
    }, []);

    useAnimationFrame(() => {
        const current = scrollY.get();
        const previous = lastScroll.current;
        lastScroll.current = current;

        if (reduceMotion || previous === null || !setWidth.current) {
            return;
        }

        const delta = current - previous;

        if (!delta) {
            return;
        }

        const direction = reverse ? 1 : -1;
        const raw = x.get() + delta * speed * direction;
        const wrapped = ((raw % setWidth.current) + setWidth.current) % setWidth.current;

        x.set(wrapped - setWidth.current);
    });

    return (
        <div aria-hidden className={['relative flex overflow-hidden select-none', className].join(' ')} style={{ transform: `rotate(${tilt}deg)` }}>
            <motion.div ref={trackRef} className="flex w-max shrink-0" style={{ x }}>
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
