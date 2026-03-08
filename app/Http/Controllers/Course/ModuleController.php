<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Http\Requests\Module\StoreModuleRequest;
use App\Http\Requests\Module\UpdateModuleRequest;
use App\Models\Course;
use App\Models\Module;
use App\Services\ModuleService;
use Inertia\Inertia;

class ModuleController extends Controller
{
    public function __construct(
        protected ModuleService $moduleService
    ) {}

    public function store(StoreModuleRequest $request, Course $course)
    {
        $this->moduleService->create([
            ...$request->validated(),
            'course_id' => $course->id,
        ]);

        return back()->with('success', 'Module created');
    }

    public function move(Course $course, Module $module)
    {
        abort_if($module->course_id !== $course->id, 404);

        request()->validate([
            'direction' => ['required', 'in:up,down'],
        ]);

        $this->moduleService->move($module, request('direction'));

        return back();
    }

    public function update(UpdateModuleRequest $request, Course $course, Module $module)
    {
        abort_if($module->course_id !== $course->id, 404);

        $this->moduleService->update($module, $request->validated());

        return back()->with('success', 'Module updated');
    }

    public function destroy(Course $course, Module $module)
    {
        abort_if($module->course_id !== $course->id, 404);

        $this->moduleService->delete($module);

        return back()->with('success', 'Module deleted');
    }
}
