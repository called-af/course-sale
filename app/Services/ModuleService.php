<?php

namespace App\Services;

use App\Models\Module;
use DomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ModuleService
{
    public function create(array $data): Module
    {
        return DB::transaction(function () use ($data) {

            if (! isset($data['sort_order'])) {
                $data['sort_order'] = Module::where('course_id', $data['course_id'])->max('sort_order') + 1;
            }

            return Module::create([
                'course_id' => $data['course_id'],
                'title' => $data['title'],
                'sort_order' => $data['sort_order'],
                'status' => $data['status'] ?? 'draft',
            ]);
        });
    }

    public function move(Module $module, string $direction): void
    {
        DB::transaction(function () use ($module, $direction) {

            if ($direction === 'up') {
                $swapWith = Module::where('course_id', $module->course_id)
                    ->where('sort_order', '<', $module->sort_order)
                    ->orderByDesc('sort_order')
                    ->first();
            }

            if ($direction === 'down') {
                $swapWith = Module::where('course_id', $module->course_id)
                    ->where('sort_order', '>', $module->sort_order)
                    ->orderBy('sort_order')
                    ->first();
            }

            if (! isset($swapWith)) {
                return;
            }

            $currentOrder = $module->sort_order;

            $module->update([
                'sort_order' => $swapWith->sort_order,
            ]);

            $swapWith->update([
                'sort_order' => $currentOrder,
            ]);
        });
    }

    public function update(Module $module, array $data): Module
    {
        return DB::transaction(function () use ($module, $data) {

            $newStatus = $data['status'] ?? $module->status;
            $isPublishing = $newStatus === 'published' && ! $module->isPublished();

            if ($isPublishing) {
                Gate::authorize('publish', $module);

                if (! $module->canBePublished()) {
                    throw new DomainException('This module is incomplete and cannot be published. Publish at least one material and its content first.');
                }
            }

            $module->update([
                'title' => $data['title'],
                'sort_order' => $data['sort_order'] ?? $module->sort_order,
                'status' => $data['status'] ?? $module->status,
            ]);

            return $module->fresh();
        });
    }

    public function delete(Module $module): void
    {
        DB::transaction(function () use ($module) {

            $deletedOrder = $module->sort_order;
            $courseId = $module->course_id;

            $module->delete();

            Module::where('course_id', $courseId)
                ->where('sort_order', '>', $deletedOrder)
                ->decrement('sort_order');
        });
    }
}
