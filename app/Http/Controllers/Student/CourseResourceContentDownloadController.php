<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\MaterialContent;
use App\Services\EnrollmentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CourseResourceContentDownloadController extends Controller
{
    /**
     * Download a lesson file that was automatically exposed as a course
     * resource, using the same completion gate as manual resources.
     */
    public function __invoke(
        Request $request,
        Course $course,
        MaterialContent $content,
        EnrollmentService $enrollmentService,
    ) {
        $content->loadMissing('material.module');

        abort_unless($content->material?->module?->course_id === $course->id, 404);
        abort_unless(in_array($content->type, ['file', 'ppt'], true), 404);
        abort_unless($content->isPublished(), 404);
        abort_unless(filled($content->content_url), 404);

        $user = $request->user();

        abort_unless($enrollmentService->isEnrolled($user, $course), 403);

        // Lesson-file resources unlock per lesson: completing the content (or
        // the whole material) is enough, while finishing the entire course
        // still unlocks everything.
        $sourceUnlocked = $enrollmentService->hasCompletedContent($user, $content)
            || $enrollmentService->hasCompletedMaterial($user, $content->material);

        abort_unless(
            $sourceUnlocked || $enrollmentService->isCompleted($user, $course),
            403,
            'Complete this lesson to unlock its resource.'
        );

        $url = $content->content_url;
        $path = parse_url($url, PHP_URL_PATH) ?: $url;
        $prefix = '/storage/';

        if (! str_starts_with($path, $prefix)) {
            return redirect()->away($url);
        }

        $relativePath = substr($path, strlen($prefix));

        abort_unless(Storage::disk('public')->exists($relativePath), 404);

        $name = Str::slug($content->title) ?: 'resource';
        $extension = pathinfo($relativePath, PATHINFO_EXTENSION);

        if ($extension !== '') {
            $name .= '.'.$extension;
        }

        return Storage::disk('public')->download($relativePath, $name);
    }
}
