<?php

namespace App\Services;

use App\Models\Tag;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TagService
{
    public function create(array $data): Tag
    {
        return DB::transaction(function () use ($data) {
            $name = trim($data['name']);

            return Tag::create([
                'name' => $name,
                'slug' => $this->generateUniqueSlug($name),
            ]);
        });
    }

    protected function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $slug = Str::slug($name);
        $original = $slug;
        $counter = 1;

        while (
            Tag::where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$original}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    public function update(Tag $tag, array $data): Tag
    {
        return DB::transaction(function () use ($tag, $data) {
            $name = trim($data['name']);

            if ($name !== $tag->name) {
                $tag->slug = $this->generateUniqueSlug($name, $tag->id);
            }

            $tag->name = $name;
            $tag->save();

            return $tag->refresh();
        });
    }

    public function delete(Tag $tag): void
    {
        DB::transaction(function () use ($tag) {
            if ($tag->courses()->exists()) {
                $tag->courses()->detach();
            }

            $tag->delete();
        });
    }
}
