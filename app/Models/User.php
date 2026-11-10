<?php

namespace App\Models;

use Illuminate\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory;
    use MustVerifyEmail;
    use Notifiable;
    use SoftDeletes;

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
        'payout_bank_name',
        'payout_account_number',
        'payout_account_name',
        'payout_account_updated_at',
        'email_verified_at',
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
        'payout_account_number',
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
            'email_verified_at' => 'datetime',
            'payout_account_number' => 'encrypted',
            'payout_account_updated_at' => 'datetime',
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

    public function payouts(): HasMany
    {
        return $this->hasMany(InstructorPayout::class, 'instructor_id');
    }

    public function payoutAccountAudits(): HasMany
    {
        return $this->hasMany(PayoutAccountAudit::class);
    }

    /**
     * Payout can only be transferred when every bank account field is filled.
     */
    public function hasCompletePayoutAccount(): bool
    {
        return filled($this->payout_bank_name)
            && filled($this->payout_account_number)
            && filled($this->payout_account_name);
    }

    /**
     * Newly changed payout accounts are locked for a while so a compromised
     * instructor account cannot redirect a payout instantly.
     */
    public function payoutAccountLockedUntil(): ?\Carbon\CarbonInterface
    {
        if (! $this->payout_account_updated_at) {
            return null;
        }

        $lockedUntil = $this->payout_account_updated_at->copy()->addHours(
            app(\App\Services\Payment\PaymentSettings::class)->payoutAccountLockHours()
        );

        return $lockedUntil->isFuture() ? $lockedUntil : null;
    }

    public function isPayoutAccountLocked(): bool
    {
        return $this->payoutAccountLockedUntil() !== null;
    }

    /**
     * Display-only form of the payout account. The full number is never
     * serialized to the frontend.
     */
    public function getPayoutAccountNumberMaskedAttribute(): ?string
    {
        $number = (string) ($this->payout_account_number ?? '');

        if ($number === '') {
            return null;
        }

        return str_repeat('•', max(0, strlen($number) - 4)).substr($number, -4);
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
