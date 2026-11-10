<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaterialContent extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'material_id',
        'type',
        'title',
        'content_url',
        'preview_url',
        'content_text',
        'duration',
        'sort_order',
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
            'material_id' => 'integer',
            'content_text' => 'array',
        ];
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }

    public function quizQuestions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(QuizQuestion::class)->orderBy('sort_order');
    }
}
