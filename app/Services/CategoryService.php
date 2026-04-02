<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CategoryService
{
    public function create(array $data): Category
    {
        return DB::transaction(function () use ($data) {

            $name = $data['name'];

            if (isset($data['img'])) {
                $data['img'] = $data['img']->store('categories', 'public');
            }

            return Category::create([
                'name' => $name,
                'slug' => $this->generateUniqueSlug($name),
                'desc' => $data['desc'] ?? null,
                'img' => $data['img'] ?? null,
            ]);
        });
    }

    protected function generateUniqueSlug(string $name): string
    {
        $slug = Str::slug($name);
        $original = $slug;
        $counter = 1;

        while (Category::where('slug', $slug)->exists()) {
            $slug = "{$original}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    public function update(Category $category, array $data): Category
    {
        return DB::transaction(function () use ($category, $data) {

            // ✅ Handle slug
            if (
                isset($data['name']) &&
                $data['name'] !== $category->name
            ) {
                $data['slug'] = $this->generateUniqueSlug($data['name']);
            }

            // ✅ FIX: hanya jalan kalau benar-benar ada file
            if (! empty($data['img'])) {

                if ($category->img) {
                    Storage::disk('public')->delete($category->img);
                }

                $data['img'] = $data['img']->store('categories', 'public');
            } else {
                // ❗ penting: jangan override img jadi null
                unset($data['img']);
            }

            $category->update($data);

            return $category->refresh();
        });
    }

    public function delete(Category $category): void
    {
        DB::transaction(function () use ($category) {

            if ($category->courses()->exists()) {
                $category->courses()->detach();
            }

            if ($category->img) {
                Storage::disk('public')->delete($category->img);
            }

            $category->delete();
        });
    }
}
