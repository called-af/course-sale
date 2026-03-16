<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Http\Requests\Course\StoreCourseRequest;
use App\Http\Requests\Course\UpdateCourseRequest;
use App\Models\Category;
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
     * List courses (admin)
     */
    public function index(): Response
    {
        $this->authorize('viewAny', Course::class);

        return Inertia::render('admin/course/page', [
            'courses' => Course::with('creator:id,name')
                ->latest()
                ->get()
                ->append('thumbnail_url'),
        ]);
    }

    /**
     * View single course
     */
    public function show(Course $course): Response
    {
        $this->authorize('view', $course);

        return Inertia::render('admin/course/[slug]/page', [
            'course' => $course
                ->load([
                    'creator:id,name',
                    'categories:id,name',
                    'modules' => function ($moduleQuery) {
                        $moduleQuery
                            ->select('id', 'course_id', 'title', 'sort_order')
                            ->orderBy('sort_order')
                            ->with([
                                'materials' => function ($materialQuery) {
                                    $materialQuery
                                        ->orderBy('sort_order')
                                        ->with([
                                            'contents' => fn ($contentQuery) => $contentQuery->orderBy('sort_order'),
                                        ]);
                                },
                            ]);
                    },
                ])
                ->append('thumbnail_url'),

            'categories' => Category::select('id', 'name', 'img', 'desc')->get(),
        ]);
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

    /**
     * Delete course
     */
    public function destroy(Course $course): RedirectResponse
    {
        $this->authorize('delete', $course);

        $course->categories()->detach();

        $course->delete();

        return match (Auth::user()->role) {

            'admin' => redirect()
                ->route('admin.courses.index')
                ->with('success', 'Course berhasil dihapus'),

            'instructor' => redirect()
                ->route('instructor.courses.index')
                ->with('success', 'Course berhasil dihapus'),

            default => redirect()
                ->route('home')
                ->with('success', 'Course berhasil dihapus'),
        };
    }
}
