<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Services\CourseService;
use App\Support\CsvExport;

class CourseStudentsExportController extends Controller
{
    public function __invoke(Course $course, CourseService $courseService)
    {
        $this->authorize('update', $course);

        $rows = (function () use ($courseService, $course) {
            foreach ($courseService->enrolledStudentRows($course) as $student) {
                yield [
                    $student['name'],
                    $student['email'],
                    $student['status'],
                    $student['enrolled_at'],
                    $student['completed_contents'],
                    $student['total_contents'],
                    $student['progress_percent'],
                ];
            }
        })();

        return CsvExport::download(
            CsvExport::filename('students-'.$course->slug),
            ['Name', 'Email', 'Enrollment Status', 'Enrolled At', 'Completed Contents', 'Total Contents', 'Progress (%)'],
            $rows,
        );
    }
}
