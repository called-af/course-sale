<?php

namespace App\Http\Controllers;

use App\Http\Requests\Enrollment\MarkProgressRequest;
use App\Http\Requests\Enrollment\StoreEnrollmentRequest;
use App\Models\Course;
use App\Services\EnrollmentService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class EnrollmentController extends Controller
{
    public function __construct(protected EnrollmentService $enrollmentService) {}

    /**
     * Enroll the authenticated user into a course.
     */
    public function store(StoreEnrollmentRequest $request, Course $course): RedirectResponse
    {
        $result = $this->enrollmentService->enroll($request->user(), $course);

        return match ($result) {
            'already_enrolled' => redirect()->route('student.courses.show', $course->slug)->with('info', 'You are already enrolled in this course.'),
            'payment_required' => back()->with('info', 'Purchases will be available soon!'),
            default => redirect()->route('student.courses.show', $course->slug)->with('success', 'Congratulations! You have successfully enrolled in the course.'),
        };
    }

    /**
     * Show the student's learning player for an enrolled course.
     * My Learning routes here directly. Discussion & ratings live on the course detail page.
     */
    public function show(\Illuminate\Http\Request $request, Course $course): Response|RedirectResponse
    {
        if (! $this->enrollmentService->isEnrolled($request->user(), $course)) {
            return redirect()
                ->route('course.index')
                ->with('error', 'You are not enrolled in this course yet.');
        }

        $learningData = $this->enrollmentService->learningData(
            $request->user(), $course, $request->integer('material'), $request->integer('content')
        );

        return Inertia::render('user/course/[enroll]/page', $learningData);
    }

    /**
     * Mark a material as completed.
     */
    public function markProgress(MarkProgressRequest $request, Course $course): RedirectResponse
    {
        $this->enrollmentService->markProgress($request->user(), $course, $request->integer('material_id'));

        return back();
    }

    /**
     * Submit a quiz attempt.
     */
    public function submitQuiz(
        \Illuminate\Http\Request $request,
        Course $course,
        \App\Models\MaterialContent $content,
        \App\Services\QuizService $quizService
    ): \Illuminate\Http\JsonResponse|\Illuminate\Http\RedirectResponse {
        $validated = $request->validate([
            'answers' => ['required', 'array'],
        ]);

        $result = $quizService->submitQuiz(
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
}
