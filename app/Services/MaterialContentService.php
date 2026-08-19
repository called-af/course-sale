<?php

namespace App\Services;

use App\Models\Material;
use App\Models\MaterialContent;
use DomainException;
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
                'type' => $data['type'] ?? 'text',
                'sort_order' => $sortOrder,
                'status' => $data['status'] ?? 'draft',
            ]);
        });
    }

    public function move(MaterialContent $materialContent, string $direction): void
    {
        DB::transaction(function () use ($materialContent, $direction) {

            $query = MaterialContent::where('material_id', $materialContent->material_id)
                ->whereNotNull('sort_order');

            if ($direction === 'up') {
                $swapWith = (clone $query)
                    ->where('sort_order', '<', $materialContent->sort_order)
                    ->orderByDesc('sort_order')
                    ->first();
            }

            if ($direction === 'down') {
                $swapWith = (clone $query)
                    ->where('sort_order', '>', $materialContent->sort_order)
                    ->orderBy('sort_order')
                    ->first();
            }

            if (! isset($swapWith)) {
                return;
            }

            $currentOrder = $materialContent->sort_order;

            $materialContent->update([
                'sort_order' => $swapWith->sort_order,
            ]);

            $swapWith->update([
                'sort_order' => $currentOrder,
            ]);
        });
    }

    public function update(MaterialContent $content, array $data): MaterialContent
    {
        return DB::transaction(function () use ($content, $data) {

            $isPublishing = ($data['status'] ?? null) === 'published';

            $contentUrl = $data['content_url'] ?? $content->content_url;
            $contentText = $data['content_text'] ?? $content->content_text;

            if ($isPublishing) {
                if ($content->status === 'published') {
                    throw new DomainException('This content has already been published.');
                }

                $isQuiz = ($data['type'] ?? $content->type) === 'quiz';

                if (! $isQuiz && empty($contentUrl) && empty($contentText)) {
                    throw new DomainException('This content is incomplete.');
                }
            }

            $content->update([
                'title' => $data['title'] ?? $content->title,
                'type' => $data['type'] ?? $content->type,
                'content_url' => $contentUrl,
                'content_text' => $contentText,
                'duration' => $data['duration'] ?? $content->duration,
                'status' => $data['status'] ?? $content->status,
            ]);

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
