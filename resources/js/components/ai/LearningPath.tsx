import { Check, Route } from 'lucide-react';
import type { LearningPathStep } from '@/components/ai/types';

interface LearningPathProps {
  pathData: LearningPathStep[];
}

export default function LearningPath({ pathData }: LearningPathProps) {
  if (pathData.length === 0) return null;

  return (
    <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400"><Route className="h-4 w-4" /></span>
        <div><h3 className="text-sm font-bold text-slate-900 dark:text-white">Learning path</h3><p className="text-[11px] text-slate-500 dark:text-slate-400">Urutan yang disarankan untuk mencapai tujuan.</p></div>
      </div>
      <ol className="space-y-3">
        {pathData.map((step, index) => (
          <li key={`${step.course_id ?? step.title}-${index}`} className="relative flex gap-3">
            <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-600 text-[11px] font-bold text-white shadow-sm">{index + 1}</div>
            {index < pathData.length - 1 && <span className="absolute left-[14px] top-7 h-[calc(100%+0.75rem)] w-px bg-purple-200 dark:bg-purple-900" />}
            <div className="min-w-0 flex-1 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800/70">
              <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{step.title}</p>
              <p className="mt-0.5 text-[10px] capitalize text-slate-500 dark:text-slate-400">{step.level ?? 'Belajar berlanjut'}</p>
            </div>
            {index === 0 && <Check className="absolute right-0 top-1 h-3.5 w-3.5 text-emerald-500" />}
          </li>
        ))}
      </ol>
    </section>
  );
}
