import { Layers3, Star } from 'lucide-react';
import type { ComparisonCourse } from '@/components/ai/types';

interface CourseComparisonProps {
  comparisonData: ComparisonCourse[];
}

export default function CourseComparison({ comparisonData }: CourseComparisonProps) {
  if (comparisonData.length === 0) return null;

  return (
    <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Perbandingan course</h3>
        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Dibandingkan berdasarkan level, harga, rating, dan modul.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
              <th className="px-4 py-3 font-semibold text-slate-500">Fitur</th>
              {comparisonData.map((course) => <th key={course.id} className="px-3 py-3 font-bold text-slate-800 dark:text-slate-100">{course.title}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100 dark:border-slate-800"><td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Level</td>{comparisonData.map((course) => <td key={course.id} className="px-3 py-3 capitalize text-slate-600 dark:text-slate-300">{course.level ?? '—'}</td>)}</tr>
            <tr className="border-b border-slate-100 dark:border-slate-800"><td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Harga</td>{comparisonData.map((course) => <td key={course.id} className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-200">{course.type === 'free' ? 'Gratis' : course.type === 'paid' && course.price !== null && course.price !== undefined ? `Rp ${Number(course.price).toLocaleString('id-ID')}` : 'Harga belum tersedia'}</td>)}</tr>
            <tr className="border-b border-slate-100 dark:border-slate-800"><td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Rating</td>{comparisonData.map((course) => <td key={course.id} className="px-3 py-3">{Number(course.rating_count) > 0 && course.rating !== null && course.rating !== undefined ? <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{Number(course.rating).toFixed(2)} ({course.rating_count})</span> : '—'}</td>)}</tr>
            <tr><td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300"><span className="inline-flex items-center gap-1"><Layers3 className="h-3 w-3" />Modul</span></td>{comparisonData.map((course) => <td key={course.id} className="px-3 py-3 text-slate-600 dark:text-slate-300">{course.modules_count ?? 0} modul</td>)}</tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
