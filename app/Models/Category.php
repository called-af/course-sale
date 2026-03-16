<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'img',
        'name',
        'desc',
        'slug',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'id' => 'integer',
        ];
    }

    public function courses()
    {
        return $this->belongsToMany(
            Course::class,
            'course_categories'
        );
    }

    protected $appends = ['img_url'];

    public function getImgUrlAttribute(): ?string
    {
        return $this->img ? asset('storage/'.$this->img) : null;
    }
}
