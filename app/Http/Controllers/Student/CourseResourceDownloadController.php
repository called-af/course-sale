<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseResource;
use App\Services\EnrollmentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CourseResourceDownloadController extends Controller
{
    public function __invoke(
        Request $request,
        Course $course,
        CourseResource $resource,
        EnrollmentService $enrollmentService,
    ) {
        abort_unless($resource->course_id === $course->id, 404);
        abort_unless($resource->isPublished(), 404);

        $user = $request->user();

        abort_unless($enrollmentService->isEnrolled($user, $course), 403);

        // Resources are only available to students who completed every material.
        abort_unless(
            $enrollmentService->isCompleted($user, $course),
            403,
            'Complete all course materials to unlock the resources.'
        );

        if ($resource->file_path) {
            abort_unless(Storage::disk('public')->exists($resource->file_path), 404);

            return Storage::disk('public')->download($resource->file_path, $resource->downloadName());
        }

        abort_unless(filled($resource->external_url), 404);

        return redirect()->away($resource->external_url);
    }
}
