<?php

namespace App\Services;

use App\Models\Course;
use DomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

use Illuminate\Support\Str;

class CourseService
{
    /**
     * Fungsi untuk membuat course
     */
    public function create(array $data, int $userId): Course
    {
        // melakukan db transkaski
        return DB::transaction(function () use ($data, $userId) {

            $title = $data['title'];

            $course = Course::create([
                'creator_id' => $userId,
                'title' => $title,
                'slug' => $this->generateUniqueSlug($title),
                'status' => 'draft',
                'type' => 'free',
            ]);

            return $course;
        });
    }

    protected function generateUniqueSlug(string $title): string
    {
        $slug = Str::slug($title);
        $original = $slug;
        $counter = 1;

        while (
            Course::where('slug', $slug)->exists()
        ) {
            $slug = "{$original}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    public function update(Course $course, array $data): Course
    {
        return DB::transaction(function () use ($course, $data) {

            if (isset($data['thumbnail'])) {

                if ($course->thumbnail) {
                    Storage::disk('public')->delete($course->thumbnail);
                }

                $data['thumbnail'] = $data['thumbnail']
                    ->store('thumbnails', 'public');
            }

            if (isset($data['title']) && $data['title'] !== $course->title) {
                $data['slug'] = $this->generateUniqueSlug($data['title']);
            }

            if (isset($data['status']) && $data['status'] === 'published') {
                if (! $course->canBePublished()) {
                    throw new DomainException('Course belum lengkap untuk dipublish');
                }

                $data['published_at'] = now();
            }

            if (isset($data['type']) && $data['type'] === 'free') {
                $data['price'] = null;
            }

            $course->update($data);

            return $course->refresh();
        });
    }
}
