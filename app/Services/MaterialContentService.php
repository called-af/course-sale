<?php

namespace App\Services;

use App\Models\Material;
use App\Models\MaterialContent;
use Illuminate\Support\Facades\DB;

class MaterialContentService
{
    /**
     * Create a new class instance.
     */
    public function create(Material $material, array $data): MaterialContent
    {
        return DB::transaction(function () use ($material, $data) {

            $sortOrder = (
                MaterialContent::where('material_id', $material->id)
                    ->max('sort_order') ?? 0
            ) + 1;

            return MaterialContent::create([
                'material_id' => $material->id,
                'title' => $data['title'],
                'type' => 'text',
                'sort_order' => $sortOrder,
            ]);
        });
    }

    public function update(MaterialContent $content, array $data): MaterialContent
    {
        return DB::transaction(function () use ($content, $data) {

            $content->update($data);

            return $content->refresh();
        });
    }

    public function delete(MaterialContent $content): void
    {
        DB::transaction(function () use ($content) {

            $deletedOrder = $content->sort_order;
            $materialId = $content->material_id;

            $content->delete();

            MaterialContent::where('material_id', $materialId)
                ->where('sort_order', '>', $deletedOrder)
                ->decrement('sort_order');
        });
    }
}
