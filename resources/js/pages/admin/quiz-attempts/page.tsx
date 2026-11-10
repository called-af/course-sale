import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, ChevronRight, ClipboardCheck, FileQuestion, Search, Users, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import AdminLayout from '@/components/templates/AdminLayout';
import UserLayout from '@/components/templates/UserLayout';

type AttemptAnswer = {
    id: number;
    answer_text: string | null;
    is_correct: boolean | null;
    quiz_question: {
        id: number;
        question: string;
        type: 'multiple_choice' | 'essay';
    } | null;
    quiz_option: {
        id: number;
        option_text: string;
    } | null;
};

type Attempt = {
    id: number;
    finished_at: string | null;
    needs_review: boolean;
    user: { id: number; name: string; email: string } | null;
    material_content: {
        id: number;
        title: string;
        material?: {
            title: string;
            module?: {
                title: string;
                course?: { id: number; title: string; slug: string };
            };
        };
    } | null;
    answers: AttemptAnswer[];
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
};

type CourseOption = {
    id: number;
    title: string;
    slug: string;
    pending_count: number;
};

type Stats = {
    pending: number;
    students: number;
    quizzes: number;
};

type Filters = {
    q: string;
    course: string;
};

type PageProps = {
    attempts: Paginated<Attempt>;
    courses: CourseOption[];
    stats: Stats;
    filters: Filters;
    selectedAttemptId: number | null;
};

export default function QuizAttemptsPage({ attempts, courses, stats, filters, selectedAttemptId }: PageProps) {
    const { auth } = usePage().props as unknown as { auth?: { user?: { role?: string } } };
    const basePath = auth?.user?.role === 'admin' ? '/admin/quiz-attempts' : '/instructor/quiz-attempts';

    const [search, setSearch] = useState(filters.q ?? '');
    const [course, setCourse] = useState(filters.course ?? '');
    const [selectedId, setSelectedId] = useState<number | null>(selectedAttemptId ?? attempts.data[0]?.id ?? null);

    // After grading, the reviewed attempt leaves the list. Fall back to the
    // next pending submission so the instructor can keep grading quickly.
    useEffect(() => {
        const exists = attempts.data.some((attempt) => attempt.id === selectedId);

        if (!exists) {
            setSelectedId(selectedAttemptId ?? attempts.data[0]?.id ?? null);
        }
    }, [attempts.data, selectedAttemptId, selectedId]);

    const selected = attempts.data.find((attempt) => attempt.id === selectedId) ?? attempts.data[0] ?? null;
    const hasFilters = Boolean(filters.q || filters.course);

    const applyFilters = (event: React.FormEvent) => {
        event.preventDefault();

        router.get(
            basePath,
            {
                ...(search.trim() ? { q: search.trim() } : {}),
                ...(course ? { course } : {}),
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const resetFilters = () => {
        setSearch('');
        setCourse('');
        router.get(basePath, {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <>
            <Head title="Quiz Submissions" />

            <div className="space-y-6">
                <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
                    <div className="relative z-10">
                        <p className="mb-1 text-sm font-medium text-purple-300">Manual Grading</p>
                        <h1 className="text-2xl font-bold sm:text-3xl">Quiz Submissions</h1>
                        <p className="mt-1 max-w-2xl text-sm text-slate-400">
                            Pick a student from the list and grade all of their essay answers in one panel. Lesson progress is already recorded on
                            submission, so grading only affects the score.
                        </p>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <StatCard icon={<ClipboardCheck size={18} />} label="Pending submissions" value={stats.pending} />
                    <StatCard icon={<Users size={18} />} label="Students waiting" value={stats.students} />
                    <StatCard icon={<FileQuestion size={18} />} label="Quizzes to grade" value={stats.quizzes} />
                </div>

                <form
                    onSubmit={applyFilters}
                    className="flex flex-col gap-3 border border-slate-200 bg-white p-4 sm:flex-row sm:items-end dark:border-slate-700 dark:bg-[#1e1f24]"
                >
                    <label className="flex-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <span className="mb-1 block">Search student</span>
                        <div className="relative">
                            <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Name or email"
                                className="w-full border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-700 outline-none focus:border-purple-400 dark:border-slate-700 dark:bg-[#141416] dark:text-slate-200"
                            />
                        </div>
                    </label>

                    <label className="flex-1 text-xs font-semibold text-slate-600 sm:max-w-xs dark:text-slate-300">
                        <span className="mb-1 block">Course</span>
                        <select
                            value={course}
                            onChange={(event) => setCourse(event.target.value)}
                            className="w-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-purple-400 dark:border-slate-700 dark:bg-[#141416] dark:text-slate-200"
                        >
                            <option value="">All courses</option>
                            {courses.map((option) => (
                                <option key={option.id} value={option.slug}>
                                    {option.title} ({option.pending_count})
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="flex items-center gap-2">
                        <Button type="submit" size="sm">
                            Apply
                        </Button>
                        {hasFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="text-xs font-semibold text-slate-500 underline-offset-2 hover:text-purple-600 hover:underline dark:text-slate-400 dark:hover:text-purple-400"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </form>

                {attempts.data.length === 0 ? (
                    <div className="border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-[#1e1f24]">
                        <ClipboardCheck className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={40} />
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                            {hasFilters ? 'No submissions match these filters' : 'Nothing to grade'}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {hasFilters ? 'Try a different student name or course.' : 'All essay submissions have been reviewed.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
                        <aside className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#1e1f24]">
                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
                                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">Queue</span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                    {attempts.total} submission{attempts.total === 1 ? '' : 's'}
                                </span>
                            </div>

                            <div className="custom-scrollbar max-h-[32rem] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-700">
                                {attempts.data.map((attempt) => {
                                    const active = selected?.id === attempt.id;
                                    const essayCount = attempt.answers.filter((answer) => answer.quiz_question?.type === 'essay').length;

                                    return (
                                        <button
                                            key={attempt.id}
                                            type="button"
                                            onClick={() => setSelectedId(attempt.id)}
                                            className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                                                active ? 'bg-purple-50 dark:bg-purple-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                                            }`}
                                        >
                                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                                                {initials(attempt.user?.name)}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-center justify-between gap-2">
                                                    <span
                                                        className={`truncate text-sm font-semibold ${
                                                            active ? 'text-purple-700 dark:text-purple-300' : 'text-slate-800 dark:text-slate-100'
                                                        }`}
                                                    >
                                                        {attempt.user?.name ?? 'Deleted student'}
                                                    </span>
                                                    <ChevronRight
                                                        size={14}
                                                        className={
                                                            active ? 'shrink-0 text-purple-500' : 'shrink-0 text-slate-300 dark:text-slate-600'
                                                        }
                                                    />
                                                </span>
                                                <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                                                    {attempt.material_content?.title ?? 'Quiz'}
                                                </span>
                                                <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400 dark:text-slate-500">
                                                    <span>{attempt.material_content?.material?.module?.course?.title}</span>
                                                    <span aria-hidden>·</span>
                                                    <span>{formatDate(attempt.finished_at)}</span>
                                                    <span className="border border-amber-200 px-1 text-[10px] font-semibold text-amber-700 dark:border-amber-900/60 dark:text-amber-400">
                                                        {essayCount} essay{essayCount === 1 ? '' : 's'}
                                                    </span>
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {attempts.last_page > 1 && (
                                <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 px-3 py-3 dark:border-slate-700">
                                    {attempts.links.map((link, index) =>
                                        link.url ? (
                                            <Link
                                                key={index}
                                                href={link.url}
                                                preserveScroll
                                                className={`border px-2.5 py-1 text-xs ${
                                                    link.active
                                                        ? 'border-purple-600 bg-purple-600 text-white'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:border-purple-400 dark:border-slate-700 dark:bg-[#1e1f24] dark:text-slate-300'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : (
                                            <span
                                                key={index}
                                                className="border border-slate-100 px-2.5 py-1 text-xs text-slate-300 dark:border-slate-800 dark:text-slate-600"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ),
                                    )}
                                </div>
                            )}
                        </aside>

                        {selected && (
                            <AttemptDetail
                                key={selected.id}
                                attempt={selected}
                                gradeUrl={`${basePath}/${selected.id}/grade`}
                                onGraded={() => setSelectedId(null)}
                            />
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

function AttemptDetail({ attempt, gradeUrl, onGraded }: { attempt: Attempt; gradeUrl: string; onGraded: () => void }) {
    const essayAnswers = useMemo(() => attempt.answers.filter((answer) => answer.quiz_question?.type === 'essay'), [attempt.answers]);
    const mcAnswers = useMemo(() => attempt.answers.filter((answer) => answer.quiz_question?.type !== 'essay'), [attempt.answers]);

    const [grades, setGrades] = useState<Record<number, boolean>>({});
    const form = useForm({ grades: {} as Record<number, boolean> });

    const gradedCount = essayAnswers.filter((answer) => grades[answer.id] !== undefined).length;
    const allGraded = gradedCount === essayAnswers.length;

    const toggle = (answerId: number, value: boolean) => {
        setGrades((previous) => ({ ...previous, [answerId]: value }));
    };

    const markAll = (value: boolean) => {
        setGrades(Object.fromEntries(essayAnswers.map((answer) => [answer.id, value])));
    };

    const submit = () => {
        if (!allGraded) {
            form.setError('grades', 'Please grade every essay answer before saving.');
            return;
        }

        form.transform(() => ({ grades }));
        form.put(gradeUrl, {
            preserveScroll: true,
            onSuccess: () => onGraded(),
        });
    };

    const course = attempt.material_content?.material?.module?.course;
    const module = attempt.material_content?.material?.module;

    return (
        <article className="border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1e1f24]">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5 dark:border-slate-700">
                <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                        {initials(attempt.user?.name)}
                    </span>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="purple">Attempt #{attempt.id}</Badge>
                            {course && <Badge>{course.title}</Badge>}
                        </div>
                        <h2 className="mt-2 text-base font-bold text-slate-900 dark:text-white">{attempt.user?.name ?? 'Deleted student'}</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{attempt.user?.email}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {module?.title} · {attempt.material_content?.title ?? 'Quiz'} · submitted{' '}
                            {attempt.finished_at ? new Date(attempt.finished_at).toLocaleString('id-ID') : '—'}
                        </p>
                    </div>
                </div>
                <span className="inline-flex items-center gap-1.5 border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400">
                    Needs review
                </span>
            </header>

            <div className="space-y-5 p-5">
                {mcAnswers.length > 0 && (
                    <section className="space-y-2">
                        <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                            Multiple choice ({mcAnswers.length})
                        </h3>
                        {mcAnswers.map((answer) => (
                            <div
                                key={answer.id}
                                className="flex items-start gap-2.5 border border-slate-100 px-3 py-2.5 text-sm dark:border-slate-700"
                            >
                                {answer.is_correct ? (
                                    <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={16} />
                                ) : (
                                    <XCircle className="mt-0.5 shrink-0 text-rose-500" size={16} />
                                )}
                                <div className="min-w-0">
                                    <p className="font-medium text-slate-700 dark:text-slate-200">{answer.quiz_question?.question}</p>
                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                        Answer: {answer.quiz_option?.option_text ?? '—'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                <section className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                            Essay answers ({essayAnswers.length})
                        </h3>
                        {essayAnswers.length > 1 && (
                            <div className="flex items-center gap-2 text-xs">
                                <button
                                    type="button"
                                    onClick={() => markAll(true)}
                                    className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                                >
                                    Mark all correct
                                </button>
                                <span className="text-slate-300 dark:text-slate-600">|</span>
                                <button
                                    type="button"
                                    onClick={() => markAll(false)}
                                    className="font-semibold text-rose-600 hover:underline dark:text-rose-400"
                                >
                                    Mark all incorrect
                                </button>
                            </div>
                        )}
                    </div>

                    {essayAnswers.map((answer, index) => (
                        <div key={answer.id} className="border border-slate-200 p-4 dark:border-slate-700">
                            <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                    {index + 1}. {answer.quiz_question?.question}
                                </p>
                                {grades[answer.id] !== undefined && (
                                    <span
                                        className={`shrink-0 border px-1.5 py-0.5 text-[10px] font-bold ${
                                            grades[answer.id]
                                                ? 'border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400'
                                                : 'border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-400'
                                        }`}
                                    >
                                        {grades[answer.id] ? 'Correct' : 'Incorrect'}
                                    </span>
                                )}
                            </div>
                            <p className="mt-2 bg-slate-50 p-3 text-sm whitespace-pre-line text-slate-700 dark:bg-[#141416] dark:text-slate-300">
                                {answer.answer_text || '(empty answer)'}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => toggle(answer.id, true)}
                                    className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold ${
                                        grades[answer.id] === true
                                            ? 'border-emerald-600 bg-emerald-600 text-white'
                                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/60 dark:text-emerald-400 dark:hover:bg-emerald-950/30'
                                    }`}
                                >
                                    <CheckCircle2 size={14} /> Correct
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toggle(answer.id, false)}
                                    className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold ${
                                        grades[answer.id] === false
                                            ? 'border-rose-600 bg-rose-600 text-white'
                                            : 'border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/30'
                                    }`}
                                >
                                    <XCircle size={14} /> Incorrect
                                </button>
                            </div>
                        </div>
                    ))}
                </section>

                {form.errors.grades && <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{form.errors.grades}</p>}

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                            <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{ width: `${essayAnswers.length > 0 ? (gradedCount / essayAnswers.length) * 100 : 0}%` }}
                            />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {gradedCount}/{essayAnswers.length} graded
                        </span>
                    </div>
                    <Button onClick={submit} isLoading={form.processing} disabled={!allGraded} leftIcon={<ClipboardCheck size={16} />}>
                        Save grade &amp; next
                    </Button>
                </div>
            </div>
        </article>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <div className="flex items-center gap-3 border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-[#1e1f24]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                {icon}
            </span>
            <div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
            </div>
        </div>
    );
}

function initials(name?: string | null): string {
    if (!name) {
        return '?';
    }

    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function QuizAttemptsLayout({ children }: { children: React.ReactNode }) {
    const { auth } = usePage().props as unknown as { auth?: { user?: { role?: string } } };

    return auth?.user?.role === 'admin' ? <AdminLayout>{children}</AdminLayout> : <UserLayout>{children}</UserLayout>;
}

QuizAttemptsPage.layout = (page: React.ReactNode) => <QuizAttemptsLayout>{page}</QuizAttemptsLayout>;
