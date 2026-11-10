<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Http\Requests\Course\MoveCourseResourceRequest;
use App\Http\Requests\Module\StoreModuleRequest;
use App\Http\Requests\Module\UpdateModuleRequest;
use App\Models\Course;
use App\Models\Module;
use App\Services\CourseStructureService;
use App\Services\ModuleService;

class ModuleController extends Controller
{
    public function __construct(
        protected ModuleService $moduleService,
        protected CourseStructureService $structureService,
    ) {}

    public function store(StoreModuleRequest $request, Course $course)
    {
        $this->authorize('create', Module::class);

        $this->moduleService->create([
            ...$request->validated(),
            'course_id' => $course->id,
        ]);

        return back()->with('success', 'Module created');
    }

    public function move(MoveCourseResourceRequest $request, Course $course, Module $module)
    {
        $this->structureService->ensureModuleBelongsToCourse($course, $module);
        $this->moduleService->move($module, $request->string('direction')->toString());

        return back();
    }

    public function update(UpdateModuleRequest $request, Course $course, Module $module)
    {
        $this->structureService->ensureModuleBelongsToCourse($course, $module);

        try {
            $this->moduleService->update($module, $request->validated());
        } catch (\DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Module updated');
    }

    public function destroy(Course $course, Module $module)
    {
        $this->structureService->ensureModuleBelongsToCourse($course, $module);
        $this->authorize('delete', $module);

        $this->moduleService->delete($module);

        return back()->with('success', 'Module deleted');
    }
}
