<?php

namespace App\Http\Controllers;

use App\Models\QuizAttempt;
use App\Services\QuizService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class QuizGradingController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user->hasRole(['admin', 'instructor']), 403);

        $pending = QuizAttempt::query()
            ->where('needs_review', true)
            ->whereHas('materialContent.material.module.course', function ($query) use ($user) {
                if ($user->role === 'instructor') {
                    $query->where('creator_id', $user->id);
                }
            });

        $search = trim((string) $request->query('q', ''));
        $courseSlug = trim((string) $request->query('course', ''));

        $stats = [
            'pending' => (clone $pending)->count(),
            'students' => (clone $pending)->distinct()->count('user_id'),
            'quizzes' => (clone $pending)->distinct()->count('material_content_id'),
        ];

        $courses = (clone $pending)
            ->with('materialContent.material.module.course:id,title,slug')
            ->get(['id', 'material_content_id'])
            ->map(fn (QuizAttempt $attempt) => $attempt->materialContent?->material?->module?->course)
            ->filter()
            ->groupBy('id')
            ->map(fn ($group) => [
                'id' => $group->first()->id,
                'title' => $group->first()->title,
                'slug' => $group->first()->slug,
                'pending_count' => $group->count(),
            ])
            ->sortBy('title')
            ->values();

        $attempts = (clone $pending)
            ->when($search !== '', function ($query) use ($search) {
                $query->whereHas('user', function ($userQuery) use ($search) {
                    $userQuery->where(function ($inner) use ($search) {
                        $inner->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
                });
            })
            ->when($courseSlug !== '', function ($query) use ($courseSlug) {
                $query->whereHas(
                    'materialContent.material.module.course',
                    fn ($courseQuery) => $courseQuery->where('slug', $courseSlug)
                );
            })
            ->with([
                'user:id,name,email',
                'materialContent:id,title,material_id',
                'materialContent.material:id,title,module_id',
                'materialContent.material.module:id,title,course_id',
                'materialContent.material.module.course:id,title,slug,creator_id',
                'answers.quizQuestion:id,question,type',
                'answers.quizOption:id,option_text',
            ])
            ->orderByDesc('finished_at')
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        $pageIds = $attempts->getCollection()->pluck('id');
        $requestedId = $request->integer('attempt');
        $selectedAttemptId = $pageIds->contains($requestedId)
            ? $requestedId
            : $pageIds->first();

        return Inertia::render('admin/quiz-attempts/page', [
            'attempts' => $attempts,
            'courses' => $courses,
            'stats' => $stats,
            'filters' => [
                'q' => $search,
                'course' => $courseSlug,
            ],
            'selectedAttemptId' => $selectedAttemptId,
        ]);
    }

    public function grade(Request $request, QuizAttempt $attempt, QuizService $quizService): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole(['admin', 'instructor']), 403);

        $course = $attempt->materialContent?->material?->module?->course;

        abort_unless($course !== null, 404);

        if ($user->role === 'instructor') {
            abort_unless($course->creator_id === $user->id, 403);
        }

        $validated = $request->validate([
            'grades' => ['required', 'array', 'min:1'],
            'grades.*' => ['required', 'boolean'],
        ]);

        $quizService->gradeAttempt($attempt, $validated['grades'], $user);

        return back()->with('success', 'Quiz attempt graded successfully.');
    }
}
