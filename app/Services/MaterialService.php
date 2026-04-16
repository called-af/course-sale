<?php

namespace App\Services;

use App\Models\Material;
use App\Models\Module;
use Illuminate\Support\Facades\DB;

class MaterialService
{
    public function create(array $data): Material
    {
        return DB::transaction(function () use ($data) {

            $sortOrder = (Material::where('module_id', $data['module_id'])
                ->max('sort_order') ?? 0) + 1;

            return Material::create([
                'module_id' => $data['module_id'],
                'title' => $data['title'],
                'description' => null,
                'sort_order' => $sortOrder,
            ]);
        });
    }

    public function update(Material $material, array $data): Material
    {
        return DB::transaction(function () use ($material, $data) {

            $material->update($data);

            return $material->refresh();
        });
    }

    public function delete(Material $material): void
    {
        DB::transaction(function () use ($material) {
            $material->delete();
        });
    }

    public function move(Material $material, string $direction): void
    {
        DB::transaction(function () use ($material, $direction) {

            if (is_null($material->sort_order)) {
                return;
            }

            $query = Material::where('module_id', $material->module_id)
                ->whereNotNull('sort_order');

            if ($direction === 'up') {
                $swapWith = (clone $query)
                    ->where('sort_order', '<', $material->sort_order)
                    ->orderByDesc('sort_order')
                    ->first();
            }

            if ($direction === 'down') {
                $swapWith = (clone $query)
                    ->where('sort_order', '>', $material->sort_order)
                    ->orderBy('sort_order')
                    ->first();
            }

            if (! isset($swapWith)) {
                return;
            }

            $currentOrder = $material->sort_order;

            $material->update([
                'sort_order' => $swapWith->sort_order,
            ]);

            $swapWith->update([
                'sort_order' => $currentOrder,
            ]);
        });
    }

    public function createForModule(Module $module, array $data): Material
    {
        return DB::transaction(function () use ($module, $data) {

            $sortOrder = (Material::where('module_id', $module->id)
                ->max('sort_order') ?? 0) + 1;

            return Material::create([
                'module_id' => $module->id,
                'title' => $data['title'],
                'sort_order' => $sortOrder,
            ]);
        });
    }
}
