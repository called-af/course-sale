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
            'already_enrolled' => redirect()->route('student.courses.show', $course->slug)->with('info', 'Anda sudah terdaftar di kursus ini.'),
            'payment_required' => back()->with('info', 'Fitur pembelian segera hadir!'),
            default => redirect()->route('student.courses.show', $course->slug)->with('success', 'Selamat! Anda berhasil mendaftar kursus.'),
        };
    }

    /**
     * Show the student's learning page for an enrolled course.
     */
    public function show(\Illuminate\Http\Request $request, Course $course): Response|RedirectResponse
    {
        if (! $this->enrollmentService->isEnrolled($request->user(), $course)) {
            return redirect()
                ->route('course.index')
                ->with('error', 'Anda belum terdaftar di kursus ini.');
        }

        return Inertia::render('user/course/[enroll]/page', $this->enrollmentService->learningData(
            $request->user(), $course, $request->integer('material'), $request->integer('content')
        ));
    }

    /**
     * Mark a material as completed.
     */
    public function markProgress(MarkProgressRequest $request, Course $course): RedirectResponse
    {
        $this->enrollmentService->markProgress($request->user(), $course, $request->integer('material_id'));

        return back();
    }
}
