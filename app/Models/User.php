<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'avatar',
        'whatsapp_number',
        'whatsapp_notification_enabled',
    ];

    protected $appends = ['avatar_url'];

    public function getAvatarUrlAttribute(): ?string
    {
        return $this->avatar
            ? asset('storage/'.$this->avatar)
            : null;
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array
     */
    protected $hidden = [
        'password',
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
            'whatsapp_notification_enabled' => 'boolean',
        ];
    }

    public function hasRole($roles): bool
    {
        return in_array($this->role, (array) $roles);
    }

    public function createdCourses(): HasMany
    {
        return $this->hasMany(Course::class, 'creator_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class, 'user_id');
    }

    public function userEvents(): HasMany
    {
        return $this->hasMany(UserEvent::class, 'user_id');
    }

    /**
     * Determine if a given student/user is enrolled in any course created by this instructor.
     */
    public function hasEnrolledStudent(User|int $student): bool
    {
        $studentId = $student instanceof User ? $student->id : $student;

        return Enrollment::where('user_id', $studentId)
            ->whereHas('course', fn ($query) => $query->where('creator_id', $this->id))
            ->exists();
    }

    /**
     * Get a query builder for users/students enrolled in courses created by this instructor.
     */
    public function enrolledStudents()
    {
        return static::whereHas('enrollments.course', function ($query) {
            $query->where('creator_id', $this->id);
        });
    }
}
