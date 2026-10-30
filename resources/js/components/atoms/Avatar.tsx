import clsx from 'clsx';
import { getInitials } from '@/lib/dashboard';

export type AvatarTone = 'purple' | 'indigo' | 'amber' | 'emerald' | 'slate';

const TONE_STYLES: Record<AvatarTone, string> = {
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

interface AvatarProps {
    name?: string | null;
    tone?: AvatarTone;
    size?: 'sm' | 'md';
    className?: string;
}

export default function Avatar({ name, tone = 'indigo', size = 'md', className }: AvatarProps) {
    return (
        <div
            className={clsx(
                'flex shrink-0 items-center justify-center rounded-full font-bold',
                size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-8 w-8 text-[10px]',
                TONE_STYLES[tone],
                className,
            )}
        >
            {getInitials(name)}
        </div>
    );
}
