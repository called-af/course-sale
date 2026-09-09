<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'course_id',
        'parent_id',
        'body',
        'is_approved',
    ];

    protected function casts(): array
    {
        return [
            'id'          => 'integer',
            'user_id'     => 'integer',
            'course_id'   => 'integer',
            'parent_id'   => 'integer',
            'is_approved' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(Comment::class, 'parent_id')->with('user:id,name,avatar')->orderBy('created_at');
    }

    public function isTopLevel(): bool
    {
        return is_null($this->parent_id);
    }
}
