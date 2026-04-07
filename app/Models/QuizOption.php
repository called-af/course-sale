<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizOption extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'quiz_question_id',
        'option_text',
        'is_correct',
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
            'quiz_question_id' => 'integer',
            'is_correct' => 'boolean',
        ];
    }

    public function answers()
    {
        return $this->hasMany(QuizAnswer::class);
    }

    public function quizQuestion(): BelongsTo
    {
        return $this->belongsTo(QuizQuestion::class);
    }
}
