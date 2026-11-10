<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Http\Requests\CourseResource\StoreCourseResourceRequest;
use App\Http\Requests\CourseResource\UpdateCourseResourceRequest;
use App\Models\Course;
use App\Models\CourseResource;
use App\Services\CourseResourceService;
use DomainException;

class CourseResourceController extends Controller
{
    public function __construct(
        protected CourseResourceService $service,
    ) {}

    public function store(StoreCourseResourceRequest $request, Course $course)
    {
        try {
            $this->service->create($course, $request->validated());
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Resource created');
    }

    public function update(UpdateCourseResourceRequest $request, Course $course, CourseResource $resource)
    {
        $this->ensureBelongsToCourse($course, $resource);

        try {
            $this->service->update($resource, $request->validated());
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Resource updated');
    }

    public function destroy(Course $course, CourseResource $resource)
    {
        $this->ensureBelongsToCourse($course, $resource);
        $this->authorize('update', $course);

        $this->service->delete($resource);

        return back()->with('success', 'Resource deleted');
    }

    protected function ensureBelongsToCourse(Course $course, CourseResource $resource): void
    {
        abort_unless($resource->course_id === $course->id, 404);
    }
}
