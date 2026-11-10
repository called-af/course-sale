<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Http\Requests\Course\MoveCourseResourceRequest;
use App\Http\Requests\Material\StoreMaterialRequest;
use App\Http\Requests\Material\UpdateMaterialRequest;
use App\Models\Course;
use App\Models\Material;
use App\Models\Module;
use App\Services\CourseStructureService;
use App\Services\MaterialService;

class MaterialController extends Controller
{
    public function __construct(
        protected MaterialService $materialService,
        protected CourseStructureService $structureService,
    ) {}

    public function store(StoreMaterialRequest $request, Course $course, Module $module)
    {
        $this->structureService->ensureModuleBelongsToCourse($course, $module);

        $this->materialService->createForModule(
            $module,
            $request->validated()
        );

        return back()->with('success', 'Material created');
    }

    public function move(MoveCourseResourceRequest $request, Course $course, Module $module, Material $material)
    {
        $this->structureService->ensureMaterialHierarchy($course, $module, $material);
        $this->materialService->move($material, $request->string('direction')->toString());

        return back();
    }

    public function update(
        UpdateMaterialRequest $request,
        Course $course,
        Module $module,
        Material $material
    ) {
        $this->structureService->ensureMaterialHierarchy($course, $module, $material);

        try {
            $this->materialService->update($material, $request->validated());
        } catch (\DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Material updated');
    }

    public function destroy(
        Course $course,
        Module $module,
        Material $material
    ) {
        $this->structureService->ensureMaterialHierarchy($course, $module, $material);
        $this->authorize('delete', $material);

        $this->materialService->delete($material);

        return back()->with('success', 'Material deleted');
    }
}
