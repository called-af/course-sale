<?php

namespace App\Jobs;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use App\Services\WhatsApp\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SendWhatsAppEnrollmentNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * Number of seconds to wait before retrying the job.
     */
    public array $backoff = [30, 60, 120];

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $enrollmentId,
        public int $instructorId,
        public int $studentId,
        public int $courseId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(WhatsAppService $whatsAppService): void
    {
        $dedupKey = "whatsapp_enrollment_sent_{$this->enrollmentId}";

        // 1. Deduplication check: Do not send if already sent for this enrollment
        if (Cache::has($dedupKey)) {
            Log::info('Skipping duplicate WhatsApp enrollment notification', [
                'enrollment_id' => $this->enrollmentId,
                'course_id' => $this->courseId,
            ]);

            return;
        }

        // 2. Concurrency lock to prevent duplicate sends from parallel queue workers
        $lockKey = "whatsapp_enrollment_lock_{$this->enrollmentId}";
        $lock = Cache::lock($lockKey, 30);

        if (! $lock->get()) {
            Log::info('WhatsApp enrollment notification is currently locked by another worker', [
                'enrollment_id' => $this->enrollmentId,
            ]);

            return;
        }

        try {
            // Re-check deduplication key inside lock
            if (Cache::has($dedupKey)) {
                return;
            }

            // 3. Verify instructor settings
            $instructor = User::find($this->instructorId);
            if (! $instructor || ! $instructor->whatsapp_notification_enabled || empty($instructor->whatsapp_number)) {
                Log::info('WhatsApp notification not sent: instructor disabled or missing phone number', [
                    'instructor_id' => $this->instructorId,
                    'enabled' => (bool) $instructor?->whatsapp_notification_enabled,
                    'has_number' => ! empty($instructor?->whatsapp_number),
                ]);

                return;
            }

            // 4. Verify enrollment
            $enrollment = Enrollment::find($this->enrollmentId);
            if (! $enrollment || $enrollment->status !== 'active') {
                Log::warning('WhatsApp notification aborted: enrollment not found or not active', [
                    'enrollment_id' => $this->enrollmentId,
                ]);

                return;
            }

            // 5. Load student and course
            $student = User::find($this->studentId);
            $course = Course::find($this->courseId);

            if (! $student || ! $course) {
                Log::warning('WhatsApp notification aborted: student or course not found', [
                    'student_id' => $this->studentId,
                    'course_id' => $this->courseId,
                ]);

                return;
            }

            // 6. Send notification via WhatsAppService
            $result = $whatsAppService->sendEnrollmentNotification(
                $instructor,
                $student,
                $course,
                $enrollment->enrolled_at
            );

            if ($result['success']) {
                // Mark deduplication key as sent (valid for 7 days)
                Cache::put($dedupKey, true, now()->addDays(7));

                Log::info('WhatsApp enrollment notification delivered to queue worker', [
                    'enrollment_id' => $this->enrollmentId,
                    'message_id' => $result['message_id'] ?? null,
                ]);
            } else {
                Log::error('Failed to send WhatsApp enrollment notification', [
                    'enrollment_id' => $this->enrollmentId,
                    'error' => $result['error'] ?? 'Unknown error',
                ]);

                // Trigger queue retry for transient delivery failures if API is configured
                if ($whatsAppService->isConfigured()) {
                    throw new \RuntimeException('Failed to send WhatsApp enrollment notification: '.($result['error'] ?? 'API error'));
                }
            }
        } finally {
            optional($lock)->release();
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(?\Throwable $exception): void
    {
        Log::error('WhatsApp enrollment notification job permanently failed after max retries', [
            'enrollment_id' => $this->enrollmentId,
            'instructor_id' => $this->instructorId,
            'course_id' => $this->courseId,
            'error' => $exception?->getMessage(),
        ]);
    }
}
