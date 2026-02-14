<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Http\Requests\Module\StoreModuleRequest;
use App\Http\Requests\Module\UpdateModuleRequest;
use App\Models\Module;
use App\Services\ModuleService;
use Illuminate\Http\RedirectResponse;

class ModuleController extends Controller
{
    public function __construct(
        protected ModuleService $moduleService
    ) {}

    public function store(StoreModuleRequest $request): RedirectResponse
    {
        $this->moduleService->create($request->validated());

        return back()->with('success', 'Module created');
    }

    public function move(Module $module): RedirectResponse
    {
        request()->validate([
            'direction' => ['required', 'in:up,down'],
        ]);

        $this->moduleService->move($module, request('direction'));

        return back();
    }

    public function update(UpdateModuleRequest $request, Module $module): RedirectResponse
    {
        $this->moduleService->update($module, $request->validated());

        return back()->with('success', 'Module updated');
    }

    public function destroy(Module $module): RedirectResponse
    {
        $this->moduleService->delete($module);

        return back()->with('success', 'Module deleted');
    }
}
