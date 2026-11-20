<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Http\Requests\Course\MoveCourseResourceRequest;
use App\Http\Requests\MaterialContent\StoreMaterialContentRequest;
use App\Http\Requests\MaterialContent\UpdateMaterialContentRequest;
use App\Models\Course;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\Module;
use App\Services\CourseStructureService;
use App\Services\MaterialContentService;
use Inertia\Inertia;

class MaterialContentController extends Controller
{
    public function __construct(
        protected MaterialContentService $service,
        protected CourseStructureService $structureService,
    ) {}

    public function store(
        StoreMaterialContentRequest $request,
        Course $course,
        Module $module,
        Material $material
    ) {
        $this->structureService->ensureMaterialHierarchy($course, $module, $material);

        $this->service->create($material, $request->validated());

        return back()->with('success', 'Content created');
    }

    public function move(
        MoveCourseResourceRequest $request,
        Course $course,
        Module $module,
        Material $material,
        MaterialContent $content
    ) {
        $this->structureService->ensureContentHierarchy($course, $module, $material, $content);
        $this->service->move($content, $request->string('direction')->toString());

        return back();
    }

    public function edit(
        Course $course,
        Module $module,
        Material $material,
        MaterialContent $content
    ) {
        $this->structureService->ensureContentHierarchy($course, $module, $material, $content);

        $view = auth()->user()?->role === 'instructor'
            ? 'student/course/[material]/page'
            : 'admin/course/[material]/page';

        return Inertia::render($view, [
            'material' => $material->load([
                'module.course',
                'contents.quizQuestions.quizOptions',
            ]),
            'editContentId' => $content->id,
            'quizQuestions' => $content->type === 'quiz'
                ? $content->load('quizQuestions.quizOptions')->quizQuestions
                : [],
        ]);
    }

    public function show(
        Course $course,
        Module $module,
        Material $material,
        MaterialContent $content
    ) {
        $this->structureService->ensureContentHierarchy($course, $module, $material, $content);

        return response()->json([
            'data' => $content->load([
                'material.module.course',
                'quizQuestions.quizOptions',
            ]),
        ]);
    }

    public function update(
        UpdateMaterialContentRequest $request,
        Course $course,
        Module $module,
        Material $material,
        MaterialContent $content
    ) {
        $this->structureService->ensureContentHierarchy($course, $module, $material, $content);

        $this->service->update($content, $request->validated());

        return back()->with('success', 'Content updated');
    }

    public function destroy(
        Course $course,
        Module $module,
        Material $material,
        MaterialContent $content
    ) {
        $this->structureService->ensureContentHierarchy($course, $module, $material, $content);
        $this->authorize('delete', $content);

        $this->service->delete($content);

        return back()->with('success', 'Content deleted');
    }
}
