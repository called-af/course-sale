<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'course_id',
        'rating',
        'comment',
        'is_approved',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'id'          => 'integer',
            'user_id'     => 'integer',
            'course_id'   => 'integer',
            'rating'      => 'integer',
            'is_approved' => 'boolean',
            'approved_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withTrashed();
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
