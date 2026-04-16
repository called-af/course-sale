<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Http\Requests\Material\StoreMaterialRequest;
use App\Http\Requests\Material\UpdateMaterialRequest;
use App\Models\Course;
use App\Models\Material;
use App\Models\Module;
use App\Services\MaterialService;

class MaterialController extends Controller
{
    public function __construct(
        protected MaterialService $materialService
    ) {}

    public function store(StoreMaterialRequest $request, Course $course, Module $module)
    {
        abort_if($module->course_id !== $course->id, 404);

        $this->authorize('create', Material::class);

        $this->materialService->createForModule(
            $module,
            $request->validated()
        );

        return back()->with('success', 'Material created');
    }

    public function move(Course $course, Module $module, Material $material)
    {
        abort_if($module->course_id !== $course->id, 404);

        request()->validate([
            'direction' => ['required', 'in:up,down'],
        ]);

        $this->materialService->move($material, request('direction'));

        return back();
    }

    public function update(
        UpdateMaterialRequest $request,
        Course $course,
        Module $module,
        Material $material
    ) {
        abort_if($module->course_id !== $course->id, 404);
        abort_if($material->module_id !== $module->id, 404);

        $this->authorize('update', $material);

        $this->materialService->update($material, $request->validated());

        return back()->with('success', 'Material updated');
    }

    public function destroy(
        Course $course,
        Module $module,
        Material $material
    ) {
        abort_if($module->course_id !== $course->id, 404);
        abort_if($material->module_id !== $module->id, 404);

        $this->authorize('delete', $material);

        $this->materialService->delete($material);

        return back()->with('success', 'Material deleted');
    }
}
