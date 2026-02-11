<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Http\Requests\Course\StoreCourseRequest;
use App\Http\Requests\Course\UpdateCourseRequest;
use App\Models\Course;
use App\Services\CourseService;
use Illuminate\Support\Facades\Auth;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    public function __construct(
        protected CourseService $courseService
    ) {
        $this->middleware('auth');
    }

    /**
     * View single course
     */
    public function show(Course $course): Response
    {
        $this->authorize('view', $course);

        return Inertia::render('Courses/Show', [
            'course' => $course->load([
                'creator:id,name',
                'modules',
            ]),
        ]);
    }

    /**
     * Store new course
     */
    public function store(
        StoreCourseRequest $request
    ): RedirectResponse {
        $this->authorize('create', Course::class);

        $course = $this->courseService->create(
            $request->validated(),
            $request->user()->id
        );

        return match ($request->user()->role) {
            'admin' => redirect()
                ->route('admin.courses.show', $course->slug),
            'instructor' => redirect()
                ->route('instructor.courses.show', $course->slug),
            default => abort(403),
        };
    }

    /**
     * Update course
     */
    public function update(
        UpdateCourseRequest $request,
        Course $course
    ): RedirectResponse {
        try {
            $course = $this->courseService->update(
                $course,
                $request->validated()
            );
        } catch (DomainException $e) {
            return back()->withErrors([
                'status' => $e->getMessage(),
            ]);
        }

        return back()->with('success', 'Course berhasil diperbarui');
    }

    /**
     * Delete course
     */
    public function destroy(Course $course): RedirectResponse
    {
        $this->authorize('delete', $course);

        $course->delete();

        return match (Auth::user()->role) {
            'admin' => redirect()->route('admin.courses.index'),
            'instructor' => redirect()->route('instructor.courses.index'),
            default => redirect()->route('home'),
        };
    }
}
