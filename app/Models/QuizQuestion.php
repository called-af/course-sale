<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizQuestion extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'material_content_id',
        'question',
        'image',
        'sort_order',
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
            'material_content_id' => 'integer',
        ];
    }

    public function quizOptions()
    {
        return $this->hasMany(QuizOption::class);
    }

    public function answers()
    {
        return $this->hasMany(QuizAnswer::class);
    }

    public function materialContent(): BelongsTo
    {
        return $this->belongsTo(MaterialContent::class);
    }
}
