<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Http\Requests\Course\StoreCourseRequest;
use App\Http\Requests\Course\SubmitCourseForReviewRequest;
use App\Http\Requests\Course\UpdateCourseRequest;
use App\Models\Course;
use App\Services\CourseService;
use DomainException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    public function __construct(
        protected CourseService $courseService
    ) {
        $this->middleware('auth')->except(['show']);
    }

    /**
     * List courses (admin/instructor)
     */
    public function index(): Response
    {
        $this->authorize('viewAny', Course::class);

        $data = $this->courseService->indexData(Auth::user());

        if (Auth::user()->role === 'instructor') {
            return Inertia::render('user/course/page', $data);
        }

        return Inertia::render('admin/course/page', $data);
    }

    /**
     * View single course
     */
    public function show(Course $course): Response
    {
        $this->authorize('view', $course);

        $view = Auth::user()->role === 'instructor'
            ? 'user/course/[slug]/page'
            : 'admin/course/[slug]/page';

        return Inertia::render($view, $this->courseService->detailData($course));
    }

    /**
     * Preview course as learning interface (admin/instructor)
     */
    public function preview(Course $course): Response
    {
        $this->authorize('view', $course);

        $view = Auth::user()->role === 'instructor'
            ? 'user/course/preview/page'
            : 'admin/course/preview/page';

        return Inertia::render($view, $this->courseService->previewData($course));
    }

    /**
     * Store new course

     */
    public function store(
        StoreCourseRequest $request
    ): RedirectResponse {

        $this->authorize('create', Course::class);

        try {

            $course = $this->courseService->create(
                $request->validated(),
                $request->user()->id
            );

            return match ($request->user()->role) {

                'admin' => redirect()
                    ->route('admin.courses.show', $course->slug)
                    ->with('success', 'Course berhasil dibuat'),

                'instructor' => redirect()
                    ->route('instructor.courses.show', $course->slug)
                    ->with('success', 'Course berhasil dibuat'),

                default => abort(403),
            };

        } catch (DomainException $e) {

            return back()->with(
                'error',
                $e->getMessage()
            );
        }
    }

    /**
     * Update course
     */
    public function update(
        UpdateCourseRequest $request,
        Course $course
    ): RedirectResponse {

        try {

            $this->courseService->update(
                $course,
                $request->validated()
            );

            return back()->with(
                'success',
                'Course berhasil diperbarui'
            );

        } catch (DomainException $e) {

            return back()->with(
                'error',
                $e->getMessage()
            );
        }
    }

    public function submitForReview(
        SubmitCourseForReviewRequest $request,
        Course $course,
    ): RedirectResponse {
        try {
            $this->courseService->submitForReview($course);

            return back()->with('success', 'Course meets all requirements and has been submitted for admin approval.');
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }
    }

    /**
     * Delete course
     */
    public function destroy(Course $course): RedirectResponse
    {
        $this->authorize('delete', $course);

        $this->courseService->delete($course);

        return match (Auth::user()->role) {

                'admin' => redirect()
                ->route('admin.courses.index')
                ->with('success', 'Course deleted successfully.'),

                'instructor' => redirect()
                ->route('instructor.courses.index')
                ->with('success', 'Course deleted successfully.'),

                default => redirect()
                ->route('home')
                ->with('success', 'Course deleted successfully.'),
        };
    }
}
