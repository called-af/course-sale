<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserEvent extends Model
{
    use HasFactory;

    public const TYPE_COURSE_VIEW = 'course_view';

    public const TYPE_COURSE_ENROLL = 'course_enroll';

    public const TYPE_MATERIAL_VIEW = 'material_view';

    public const TYPE_MATERIAL_COMPLETE = 'material_complete';

    public const TYPE_QUIZ_ATTEMPT = 'quiz_attempt';

    public const TYPE_QUIZ_COMPLETE = 'quiz_complete';

    protected $fillable = [
        'user_id',
        'course_id',
        'material_id',
        'event_type',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'user_id' => 'integer',
            'course_id' => 'integer',
            'material_id' => 'integer',
            'metadata' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
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

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }
}
