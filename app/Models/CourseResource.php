<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class CourseResource extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'title',
        'description',
        'file_path',
        'external_url',
        'status',
        'sort_order',
    ];

    protected $appends = ['url'];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'course_id' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    /**
     * Public URL of the stored file (only meaningful for uploaded files).
     */
    public function getFileUrlAttribute(): ?string
    {
        return $this->file_path ? '/storage/'.$this->file_path : null;
    }

    /**
     * Direct URL for admins/instructors previewing the course.
     */
    public function getUrlAttribute(): ?string
    {
        return $this->file_url ?? $this->external_url;
    }

    public function downloadName(): string
    {
        $base = Str::slug($this->title) ?: 'resource';

        if (! $this->file_path) {
            return $base;
        }

        $extension = pathinfo($this->file_path, PATHINFO_EXTENSION);

        return $extension !== '' ? "{$base}.{$extension}" : $base;
    }
}
