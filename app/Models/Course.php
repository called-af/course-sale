<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
        'approved_at',
        'rating_avg',
        'rating_count',
        'certificate_template',
    ];

    protected $appends = ['thumbnail_url'];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'creator_id' => 'integer',
            'price' => 'decimal:2',
            'published_at' => 'datetime',
            'approved_at' => 'datetime',
            'rating_avg' => 'decimal:2',
            'certificate_template' => 'array',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONS
    |--------------------------------------------------------------------------
    */

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id')->withTrashed();
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

    public function category()
    {
        return $this->categories();
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'course_tags');
    }

    public function userEvents(): HasMany
    {
        return $this->hasMany(UserEvent::class);
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
            // Only perform permanent purge actions if the course is being force-deleted
            if ($course->isForceDeleting()) {
                if ($course->enrollments()->exists() || \App\Models\OrderItem::where('course_id', $course->id)->exists()) {
                    throw new \DomainException('Course cannot be permanently deleted because it has enrolled students or purchase history.');
                }

                $course->categories()->detach();
                $course->tags()->detach();

                if ($course->thumbnail) {
                    Storage::disk('public')->delete($course->thumbnail);
                }
            }
        });
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function approvedReviews(): HasMany
    {
        return $this->hasMany(Review::class)->where('is_approved', true);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function getThumbnailUrlAttribute(): string
    {
        if ($this->thumbnail) {
            if (str_starts_with($this->thumbnail, 'assets/')) {
                return asset($this->thumbnail);
            }

            return asset('storage/' . $this->thumbnail);
        }

        return asset('assets/landscape.jpeg');
    }
}
