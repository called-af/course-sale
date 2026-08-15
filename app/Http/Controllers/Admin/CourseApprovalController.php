<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Course\ApproveCourseRequest;
use App\Models\Course;
use App\Services\CourseApprovalService;
use DomainException;
use Illuminate\Http\RedirectResponse;

class CourseApprovalController extends Controller
{
    public function __construct(private CourseApprovalService $courseApprovalService) {}

    public function approve(ApproveCourseRequest $request, Course $course): RedirectResponse
    {
        try {
            $this->courseApprovalService->approve($course);

            return back()->with('success', 'Course approved and published successfully.');
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }
    }
}
