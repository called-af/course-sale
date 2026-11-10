<?php

namespace App\Services;

use App\Models\Course;
use App\Models\CourseResource;
use DomainException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CourseResourceService
{
    /**
     * Directory (on the public disk) where course resource files are stored.
     */
    protected const UPLOAD_DIRECTORY = 'course-resources';

    public function create(Course $course, array $data): CourseResource
    {
        return DB::transaction(function () use ($course, $data) {
            $file = $data['file'] ?? null;
            $filePath = $file instanceof UploadedFile
                ? $file->store(self::UPLOAD_DIRECTORY.'/'.$course->id, 'public')
                : null;

            $externalUrl = filled($data['external_url'] ?? null) ? $data['external_url'] : null;

            $this->ensureSource($data['status'] ?? 'draft', $filePath, $externalUrl);

            return CourseResource::create([
                'course_id' => $course->id,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'file_path' => $filePath,
                'external_url' => $filePath ? null : $externalUrl,
                'status' => $data['status'] ?? 'draft',
                'sort_order' => (CourseResource::where('course_id', $course->id)->max('sort_order') ?? 0) + 1,
            ]);
        });
    }

    public function update(CourseResource $resource, array $data): CourseResource
    {
        return DB::transaction(function () use ($resource, $data) {
            $file = $data['file'] ?? null;
            $filePath = $resource->file_path;
            $externalUrl = array_key_exists('external_url', $data)
                ? (filled($data['external_url']) ? $data['external_url'] : null)
                : $resource->external_url;

            // A new upload always wins over a pasted URL.
            if ($file instanceof UploadedFile) {
                $this->deleteFile($resource->file_path);
                $filePath = $file->store(self::UPLOAD_DIRECTORY.'/'.$resource->course_id, 'public');
                $externalUrl = null;
            } elseif (filled($externalUrl)) {
                // Switching to an external URL removes a previously uploaded file.
                $this->deleteFile($resource->file_path);
                $filePath = null;
            }

            $this->ensureSource($data['status'] ?? $resource->status, $filePath, $externalUrl);

            $resource->update([
                'title' => $data['title'] ?? $resource->title,
                'description' => array_key_exists('description', $data) ? $data['description'] : $resource->description,
                'file_path' => $filePath,
                'external_url' => $externalUrl,
                'status' => $data['status'] ?? $resource->status,
            ]);

            return $resource->refresh();
        });
    }

    public function delete(CourseResource $resource): void
    {
        DB::transaction(function () use ($resource) {
            $this->deleteFile($resource->file_path);
            $resource->delete();
        });
    }

    protected function ensureSource(string $status, ?string $filePath, ?string $externalUrl): void
    {
        if ($status === 'published' && blank($filePath) && blank($externalUrl)) {
            throw new DomainException('Add a file or an external URL before publishing this resource.');
        }
    }

    protected function deleteFile(?string $filePath): void
    {
        if ($filePath) {
            Storage::disk('public')->delete($filePath);
        }
    }
}
