<?php

namespace App\Services;

use App\Models\Course;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use DomainException;

class CourseService
{
  public function create(array $data, int $userId): Course
  {
    return DB::transaction(function () use ($data, $userId) {

      $title = $data['title'];

      $course = Course::create([
        'creator_id' => $userId,
        'title'      => $title,
        'slug'       => $this->generateUniqueSlug($title),
        'status'     => 'draft',
        'type'       => 'free',
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

      // 1. Kalau title berubah → regenerate slug
      if (isset($data['title']) && $data['title'] !== $course->title) {
        $data['slug'] = $this->generateUniqueSlug($data['title']);
      }

      // 2. Kalau mau publish → cek kelengkapan
      if (
        isset($data['status']) &&
        $data['status'] === 'published'
      ) {
        if (! $course->canBePublished()) {
          throw new DomainException(
            'Course belum lengkap untuk dipublish'
          );
        }

        $data['published_at'] = now();
      }

      // 3. Kalau type free → price NULL
      if (
        isset($data['type']) &&
        $data['type'] === 'free'
      ) {
        $data['price'] = null;
      }

      // 4. Update data
      $course->update($data);

      return $course->refresh();
    });
  }
}
