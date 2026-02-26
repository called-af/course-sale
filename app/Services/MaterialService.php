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
                'is_preview' => false,
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

    public function reorder(array $orders): void
    {
        DB::transaction(function () use ($orders) {

            foreach ($orders as $id => $sortOrder) {
                Material::where('id', $id)->update([
                    'sort_order' => $sortOrder,
                ]);
            }
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
                'is_preview' => false,
            ]);
        });
    }
}
