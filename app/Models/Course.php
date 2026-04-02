<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Course extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'creator_id',
        'title',
        'slug',
        'description',
        'thumbnail',
        'type',
        'price',
        'level',
        'status',
        'published_at',
        'rating_avg',
        'rating_count',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'creator_id' => 'integer',
            'price' => 'decimal:2',
            'published_at' => 'datetime',
            'rating_avg' => 'decimal:2',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONS
    |--------------------------------------------------------------------------
    */

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function modules(): HasMany
    {
        return $this->hasMany(Module::class);
    }

    public function categories()
    {
        return $this->belongsToMany(
            Category::class,
            'course_categories'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS (BUSINESS LOGIC)
    |--------------------------------------------------------------------------
    */

    public function canBePublished(): bool
    {
        return
            filled($this->title) &&
            filled($this->description) &&
            filled($this->level) &&
            filled($this->thumbnail) &&
            $this->modules()->exists() &&
            $this->categories()->exists();
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isPaid(): bool
    {
        return $this->type === 'paid';
    }

    protected static function booted(): void
    {
        static::deleting(function (Course $course) {

            $course->categories()->detach();

            if ($course->thumbnail) {
                Storage::disk('public')->delete($course->thumbnail);
            }

            $course->modules()->delete();
        });
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function getThumbnailUrlAttribute(): string
    {
        if ($this->thumbnail) {
            return asset('storage/'.$this->thumbnail);
        }

        return asset('assets/landscape.jpeg');
    }
}
