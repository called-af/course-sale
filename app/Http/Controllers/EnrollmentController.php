<?php

namespace App\Http\Controllers;

use App\Http\Requests\Enrollment\MarkProgressRequest;
use App\Http\Requests\Enrollment\StoreEnrollmentRequest;
use App\Models\Course;
use App\Models\MaterialContent;
use App\Services\EnrollmentService;
use App\Services\QuizService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EnrollmentController extends Controller
{
    public function __construct(
        protected EnrollmentService $enrollmentService,
        protected QuizService $quizService,
    ) {}

    /**
     * Enroll the authenticated user into a course.
     */
    public function store(StoreEnrollmentRequest $request, Course $course): RedirectResponse
    {
        $result = $this->enrollmentService->enroll($request->user(), $course);

        return match ($result) {
            'already_enrolled' => redirect()->route('student.courses.show', $course->slug)->with('info', 'You are already enrolled in this course.'),
            'payment_required' => redirect()
                ->route('student.course.checkout', $course->slug)
                ->with('info', 'Please complete the payment to access this course.'),
            default => redirect()->route('student.courses.show', $course->slug)->with('success', 'Congratulations! You have successfully enrolled in the course.'),
        };
    }

    /**
     * Show the student's learning player for an enrolled course.
     * My Learning routes here directly. Discussion & ratings live on the course detail page.
     */
    public function show(Request $request, Course $course): Response|RedirectResponse
    {
        if (! $this->enrollmentService->isEnrolled($request->user(), $course)) {
            return redirect()
                ->route('course.index')
                ->with('error', 'You are not enrolled in this course yet.');
        }

        $learningData = $this->enrollmentService->learningData(
            $request->user(), $course, $request->integer('material'), $request->integer('content')
        );

        return Inertia::render('student/course/[enroll]/page', $learningData);
    }

    /**
     * Mark a material as completed.
     */
    public function markProgress(MarkProgressRequest $request, Course $course): RedirectResponse
    {
        $this->enrollmentService->markProgress(
            $request->user(),
            $course,
            $request->integer('material_id')
        );

        return back()->with('success', 'Material marked as complete.');
    }

    /**
     * Mark a single lesson content as viewed (text/file/ppt).
     */
    public function markContentProgress(Request $request, Course $course, MaterialContent $content): JsonResponse|RedirectResponse
    {
        $this->ensureEnrolled($request, $course, $content);

        $completed = $this->enrollmentService->markContentProgress($request->user(), $course, $content);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => $completed,
                'message' => $completed ? 'Lesson completed.' : 'Quiz lessons are completed by submitting the quiz.',
            ]);
        }

        return back();
    }

    /**
     * Start or resume a quiz attempt.
     */
    public function startQuiz(Request $request, Course $course, MaterialContent $content): JsonResponse
    {
        $this->ensureEnrolled($request, $course, $content);

        return response()->json([
            'state' => $this->quizService->start($request->user(), $content),
        ]);
    }

    /**
     * Autosave the student's quiz draft answers.
     */
    public function saveQuizDraft(Request $request, Course $course, MaterialContent $content): JsonResponse
    {
        $this->ensureEnrolled($request, $course, $content);

        $validated = $request->validate([
            'answers' => ['present', 'array'],
        ]);

        return response()->json([
            'state' => $this->quizService->saveDraft($request->user(), $content, $validated['answers']),
        ]);
    }

    /**
     * Reset the current quiz attempt and start over.
     */
    public function resetQuiz(Request $request, Course $course, MaterialContent $content): JsonResponse
    {
        $this->ensureEnrolled($request, $course, $content);

        return response()->json([
            'state' => $this->quizService->reset($request->user(), $content),
        ]);
    }

    /**
     * Submit a quiz attempt.
     */
    public function submitQuiz(Request $request, Course $course, MaterialContent $content): JsonResponse|RedirectResponse
    {
        $this->ensureEnrolled($request, $course, $content);

        $validated = $request->validate([
            'answers' => ['required', 'array'],
        ]);

        $result = $this->quizService->submitQuiz(
            $request->user(),
            $content,
            $validated['answers'],
            $course
        );

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Quiz submitted successfully.',
                'data' => $result,
            ]);
        }

        return back()->with('success', 'Quiz submitted successfully. Score: '.$result['score'].'%');
    }

    /**
     * Ensure the content belongs to the course and the user is enrolled.
     */
    protected function ensureEnrolled(Request $request, Course $course, MaterialContent $content): void
    {
        $content->loadMissing('material.module');

        abort_unless($content->material?->module?->course_id === $course->id, 404);
        abort_unless($this->enrollmentService->isEnrolled($request->user(), $course), 403);
    }
}
