<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizAttempt extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'material_content_id',
        'started_at',
        'finished_at',
        'time_spent',
        'score',
        'needs_review',
        'reviewed_by',
        'reviewed_at',
        'status',
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
            'user_id' => 'integer',
            'material_content_id' => 'integer',
            'started_at' => 'timestamp',
            'finished_at' => 'timestamp',
            'score' => 'decimal:2',
            'needs_review' => 'boolean',
            'reviewed_at' => 'timestamp',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withTrashed();
    }

    public function answers()
    {
        return $this->hasMany(QuizAnswer::class);
    }

    public function materialContent(): BelongsTo
    {
        return $this->belongsTo(MaterialContent::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by')->withTrashed();
    }
}
