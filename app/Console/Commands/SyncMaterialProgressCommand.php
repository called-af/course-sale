<?php

namespace App\Console\Commands;

use App\Models\Course;
use App\Models\User;
use App\Services\EnrollmentService;
use Illuminate\Console\Command;

class SyncMaterialProgressCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'progress:sync-materials
                            {--user= : Limit to a specific user ID}
                            {--course= : Limit to a specific course ID}
                            {--dry-run : Show how many user-course pairs would be processed without writing}';

    /**
     * @var string
     */
    protected $description = 'Backfill and reconcile material-level progress from content-level progress (idempotent, backend-derived).';

    public function handle(EnrollmentService $enrollmentService): int
    {
        $userId = $this->option('user');
        $courseId = $this->option('course');
        $dryRun = (bool) $this->option('dry-run');

        $query = \App\Models\Enrollment::query()
            ->select(['id', 'user_id', 'course_id'])
            ->where('status', 'active')
            ->when($userId, fn ($q) => $q->where('user_id', $userId))
            ->when($courseId, fn ($q) => $q->where('course_id', $courseId))
            ->orderBy('id');

        $total = (clone $query)->count();

        if ($total === 0) {
            $this->info('No enrollments matched the given filters.');

            return self::SUCCESS;
        }

        if ($dryRun) {
            $this->info("[dry-run] {$total} enrollment(s) would be reconciled.");

            return self::SUCCESS;
        }

        $processed = 0;
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $query->chunkById(100, function ($enrollments) use (&$processed, $bar, $enrollmentService): void {
            $userIds = $enrollments->pluck('user_id')->unique()->values();
            $courseIds = $enrollments->pluck('course_id')->unique()->values();

            $users = User::query()->whereIn('id', $userIds)->get()->keyBy('id');
            $courses = Course::query()->whereIn('id', $courseIds)->get()->keyBy('id');

            foreach ($enrollments as $enrollment) {
                $user = $users->get($enrollment->user_id);
                $course = $courses->get($enrollment->course_id);

                if ($user && $course) {
                    $enrollmentService->reconcileMaterialProgress($user, $course);
                }

                $processed++;
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine();
        $this->info("Reconciled material progress for {$processed} enrollment(s).");

        return self::SUCCESS;
    }
}
