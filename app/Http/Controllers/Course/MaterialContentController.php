<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Http\Requests\MaterialContent\StoreMaterialContentRequest;
use App\Http\Requests\MaterialContent\UpdateMaterialContentRequest;
use App\Models\Course;
use App\Models\Material;
use App\Models\MaterialContent;
use App\Models\Module;
use App\Services\MaterialContentService;
use Inertia\Inertia;

class MaterialContentController extends Controller
{
    public function __construct(
        protected MaterialContentService $service
    ) {}

    public function store(
        StoreMaterialContentRequest $request,
        Course $course,
        Module $module,
        Material $material
    ) {
        abort_if($module->course_id !== $course->id, 404);
        abort_if($material->module_id !== $module->id, 404);

        $this->authorize('create', [MaterialContent::class, $material]);

        $this->service->create($material, $request->validated());

        return back()->with('success', 'Content created');
    }

    public function edit(
        Course $course,
        Module $module,
        Material $material,
        MaterialContent $content
    ) {
        abort_if($module->course_id !== $course->id, 404);
        abort_if($material->module_id !== $module->id, 404);
        abort_if($content->material_id !== $material->id, 404);

        $this->authorize('update', $content);

        return Inertia::render('admin/course/[material]/page', [
            'material' => $material->load([
                'module.course',
                'contents',
            ]),
            'editContentId' => $content->id,
        ]);
    }

    public function show(
        Course $course,
        Module $module,
        Material $material,
        MaterialContent $content
    ) {
        abort_if($module->course_id !== $course->id, 404);
        abort_if($material->module_id !== $module->id, 404);
        abort_if($content->material_id !== $material->id, 404);

        $this->authorize('update', $content);

        return response()->json([
            'data' => $content->load([
                'material.module.course',
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
        abort_if($module->course_id !== $course->id, 404);
        abort_if($material->module_id !== $module->id, 404);
        abort_if($content->material_id !== $material->id, 404);

        $this->authorize('update', $content);

        logger($request->content_text);

        $this->service->update($content, $request->validated());

        return back()->with('success', 'Content updated');
    }

    public function destroy(
        Course $course,
        Module $module,
        Material $material,
        MaterialContent $content
    ) {
        abort_if($module->course_id !== $course->id, 404);
        abort_if($material->module_id !== $module->id, 404);
        abort_if($content->material_id !== $material->id, 404);

        $this->authorize('delete', $content);

        $this->service->delete($content);

        return back()->with('success', 'Content deleted');
    }
}
