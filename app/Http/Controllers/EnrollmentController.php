<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Material;
use App\Models\MaterialProgress;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class EnrollmentController extends Controller
{
    /**
     * Enroll the authenticated user into a course.
     */
    public function store(Request $request, Course $course): RedirectResponse
    {
        $user = Auth::user();

        abort_unless($course->isPublished(), 404);

        // Already enrolled? Just redirect to learning page
        $existing = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        if ($existing) {
            return redirect()
                ->route('student.courses.show', $course->slug)
                ->with('info', 'Anda sudah terdaftar di kursus ini.');
        }

        // For paid courses, redirect to checkout (placeholder)
        if ($course->isPaid()) {
            // TODO: implement payment / checkout flow
            return back()->with('info', 'Fitur pembelian segera hadir!');
        }

        Enrollment::create([
            'user_id'     => $user->id,
            'course_id'   => $course->id,
            'status'      => 'active',
            'enrolled_at' => now(),
        ]);

        // If user has no role yet, set to student
        if (is_null($user->role)) {
            $user->update(['role' => 'student']);
        }

        return redirect()
            ->route('student.courses.show', $course->slug)
            ->with('success', 'Selamat! Anda berhasil mendaftar kursus.');
    }

    /**
     * Show the student's learning page for an enrolled course.
     */
    public function show(Request $request, Course $course): Response|RedirectResponse
    {
        $user = Auth::user();

        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'active')
            ->first();

        if (! $enrollment) {
            return redirect()
                ->route('course.index')
                ->with('error', 'Anda belum terdaftar di kursus ini.');
        }

        $course->load([
            'modules' => fn ($q) => $q->orderBy('sort_order')->with([
                'materials' => fn ($mq) => $mq->orderBy('sort_order')->with([
                    'contents' => fn ($cq) => $cq
                        ->orderBy('sort_order')
                        ->with(['quizQuestions.quizOptions']),
                ]),
            ]),
        ]);

        // Determine current content from query string, defaulting to first material's first content
        $currentContent = null;
        $currentMaterial = null;

        $materialId = $request->query('material');
        $contentId  = $request->query('content');

        if ($materialId && $contentId) {
            foreach ($course->modules as $module) {
                foreach ($module->materials as $material) {
                    if ($material->id == $materialId) {
                        $currentMaterial = $material;
                        $currentContent  = $material->contents->firstWhere('id', $contentId);
                        break 2;
                    }
                }
            }
        }

        // Default to first material / first content
        if (! $currentContent) {
            $firstMaterial = $course->modules->first()?->materials->first();
            if ($firstMaterial) {
                $currentMaterial = $firstMaterial;
                $currentContent  = $firstMaterial->contents->first();
            }
        }

        // Progress map: material_id => is_completed
        $progressMap = MaterialProgress::where('user_id', $user->id)
            ->whereIn(
                'material_id',
                $course->modules->flatMap(fn ($m) => $m->materials->pluck('id'))
            )
            ->pluck('is_completed', 'material_id')
            ->toArray();

        return Inertia::render('user/course/[enroll]/page', [
            'course'          => $course->append('thumbnail_url'),
            'currentMaterial' => $currentMaterial,
            'currentContent'  => $currentContent,
            'progress'        => $progressMap,
        ]);
    }

    /**
     * Mark a material as completed.
     */
    public function markProgress(Request $request, Course $course): RedirectResponse
    {
        $request->validate(['material_id' => ['required', 'integer', 'exists:materials,id']]);

        $user = Auth::user();
        $this->authorize('view', $course);
        $material = Material::query()
            ->whereKey($request->integer('material_id'))
            ->whereHas('module', fn ($query) => $query->where('course_id', $course->id))
            ->firstOrFail();

        MaterialProgress::updateOrCreate(
            ['user_id' => $user->id, 'material_id' => $material->id],
            ['is_completed' => true, 'completed_at' => now()]
        );

        return back();
    }
}
