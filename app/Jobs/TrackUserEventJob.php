<?php

namespace App\Jobs;

use App\Models\UserEvent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class TrackUserEventJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $userId,
        public string $eventType,
        public ?int $courseId = null,
        public ?int $materialId = null,
        public array $metadata = []
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            UserEvent::create([
                'user_id' => $this->userId,
                'course_id' => $this->courseId,
                'material_id' => $this->materialId,
                'event_type' => $this->eventType,
                'metadata' => $this->metadata,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to log UserEvent asynchronously: '.$e->getMessage(), [
                'user_id' => $this->userId,
                'event_type' => $this->eventType,
            ]);
        }
    }
}
