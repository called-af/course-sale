import clsx from 'clsx';
import { motion, useReducedMotion } from 'motion/react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useEffect, useState } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type NativeButtonProps = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'
>;

interface ButtonProps extends NativeButtonProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    widthFull?: boolean;
    isLoading?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

export default function Button({
    children,
    widthFull = false,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled,
    leftIcon,
    rightIcon,
    className,
    ...props
}: ButtonProps) {
    const reduceMotion = useReducedMotion();
    const [canHover, setCanHover] = useState(true);
    const isDisabled = disabled || isLoading;
    const canAnimate = !isDisabled && !reduceMotion;
    const canSweep = canAnimate && canHover;

    useEffect(() => {
        const query = window.matchMedia('(hover: hover)');
        const update = () => setCanHover(query.matches);

        update();
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);

    return (
        <motion.button
            disabled={isDisabled}
            initial="rest"
            animate="rest"
            variants={{
                rest: {},
                hover: {},
                tap: { scale: 0.98 },
            }}
            whileHover={canSweep ? 'hover' : undefined}
            whileTap={canAnimate ? 'tap' : undefined}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className={clsx(
                // Base
                'relative inline-flex items-center justify-center gap-2 overflow-hidden font-semibold',
                'transition-[color,background-color,border-color,box-shadow,opacity] duration-200 ease-out',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#141416]',
                'cursor-pointer select-none',
                canSweep && variant !== 'ghost' && 'btn-sweep',

                // Width
                widthFull ? 'w-full' : '',

                // Sizes
                {
                    'gap-1.5 px-3 py-1.5 text-xs': size === 'sm',
                    'px-4 py-2.5 text-sm': size === 'md',
                    'px-6 py-3 text-base': size === 'lg',
                },

                // Variants
                {
                    // Primary — purple with glow removed
                    'bg-gradient-to-b from-purple-500 to-purple-700 text-white hover:from-purple-400 hover:to-purple-600 focus-visible:ring-purple-500':
                        variant === 'primary',

                    // Secondary — slate with subtle depth
                    'bg-gradient-to-b from-slate-600 to-slate-700 text-white hover:from-slate-500 hover:to-slate-600 focus-visible:ring-slate-500':
                        variant === 'secondary',

                    // Outline — glass-like border
                    'border border-neutral-200/80 bg-white/80 text-neutral-700 backdrop-blur-sm hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 focus-visible:ring-neutral-400 dark:border-slate-700/80 dark:bg-[#1e1f24] dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white':
                        variant === 'outline',

                    // Danger — bold red
                    'bg-gradient-to-b from-red-500 to-red-700 text-white hover:from-red-400 hover:to-red-600 focus-visible:ring-red-500':
                        variant === 'danger',

                    // Ghost — transparent with hover surface
                    'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-neutral-400 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white':
                        variant === 'ghost',
                },

                // Disabled / Loading
                {
                    'pointer-events-none !cursor-not-allowed !opacity-50': isDisabled,
                },

                className,
            )}
            {...props}
        >
            {variant !== 'ghost' && (
                <>
                    {/* light theme: glossy diagonal sheen sweeping across on hover */}
                    <motion.span
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 left-0 h-[240%] w-1/2 -translate-y-1/2 bg-gradient-to-r from-white/0 via-white/55 to-white/0 dark:hidden"
                        variants={{
                            rest: {
                                x: '-190%',
                                rotate: -20,
                                opacity: 0,
                                transition: { duration: 0.22, ease: 'easeOut' },
                            },
                            hover: {
                                x: '310%',
                                rotate: -20,
                                opacity: 1,
                                transition: {
                                    x: { duration: 0.9, ease: [0.22, 0.61, 0.36, 1] },
                                    opacity: { duration: 0.12 },
                                },
                            },
                        }}
                    />

                    {/* dark theme: white fill wipes in from the left with a slanted edge */}
                    <motion.span
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 -left-[40%] hidden w-[180%] bg-white dark:block"
                        variants={{
                            rest: { x: '-100%', skewX: -22, transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } },
                            hover: { x: '0%', skewX: -22, transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] } },
                        }}
                    />
                </>
            )}

            {/* loading spinner overlay */}
            {isLoading && (
                <span className="absolute inset-0 z-10 flex items-center justify-center">
                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </span>
            )}

            {/* content — invisible when loading so spinner is centered */}
            <span
                className={clsx(
                    'btn-sweep-label relative z-10 inline-flex items-center gap-2 transition-[color,opacity] duration-200',
                    canSweep && variant !== 'ghost' && 'delay-150',
                    isLoading && 'opacity-0',
                )}
            >
                {leftIcon && <span className="flex shrink-0 items-center">{leftIcon}</span>}
                {children}
                {rightIcon && <span className="flex shrink-0 items-center">{rightIcon}</span>}
            </span>
        </motion.button>
    );
}
