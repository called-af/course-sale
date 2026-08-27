<?php

namespace App\Console\Commands;

use App\Models\Course;
use App\Models\Material;
use App\Models\User;
use App\Models\UserEvent;
use Illuminate\Console\Command;

class SeedRecommendationEventsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'recommendation:seed-events
                            {--users=10 : Number of simulated active users}
                            {--events-per-user=8 : Target average events per user}
                            {--truncate : Truncate user_events table before generating}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate realistic synthetic user events for ML data pipeline testing and offline experimentation';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if ($this->option('truncate')) {
            if ($this->confirm('Are you sure you want to truncate the user_events table?', false)) {
                UserEvent::truncate();
                $this->info('user_events table truncated.');
            }
        }

        $users = User::all();
        if ($users->isEmpty()) {
            $this->error('No users found in database. Please run User seeder first.');

            return Command::FAILURE;
        }

        $courses = Course::with('modules.materials')->where('status', 'published')->get();
        if ($courses->isEmpty()) {
            $courses = Course::with('modules.materials')->get();
        }

        if ($courses->isEmpty()) {
            $this->error('No courses found in database.');

            return Command::FAILURE;
        }

        $targetUsersCount = min((int) $this->option('users'), $users->count());
        $targetEventsPerUser = max(1, (int) $this->option('events-per-user'));

        $selectedUsers = $users->random($targetUsersCount);
        $totalCreated = 0;

        $eventTypes = [
            UserEvent::TYPE_COURSE_VIEW,
            UserEvent::TYPE_COURSE_ENROLL,
            UserEvent::TYPE_MATERIAL_VIEW,
            UserEvent::TYPE_MATERIAL_COMPLETE,
            UserEvent::TYPE_QUIZ_ATTEMPT,
            UserEvent::TYPE_QUIZ_COMPLETE,
        ];

        $this->info("Simulating interactions for {$targetUsersCount} users across {$courses->count()} courses...");

        $bar = $this->output->createProgressBar($targetUsersCount);
        $bar->start();

        foreach ($selectedUsers as $user) {
            $numEvents = max(1, (int) round(fake()->numberBetween(
                (int) round($targetEventsPerUser * 0.6),
                (int) round($targetEventsPerUser * 1.5)
            )));

            // Pick 1 to 4 courses this user is interested in
            $interestedCourses = $courses->random(min(rand(1, 4), $courses->count()));

            for ($i = 0; $i < $numEvents; $i++) {
                $course = $interestedCourses->random();
                $eventType = fake()->randomElement($eventTypes);

                $materialId = null;
                $metadata = null;

                // Pick a material if related event
                $allMaterials = $course->modules->flatMap->materials;
                if ($allMaterials->isNotEmpty() && in_array($eventType, [
                    UserEvent::TYPE_MATERIAL_VIEW,
                    UserEvent::TYPE_MATERIAL_COMPLETE,
                    UserEvent::TYPE_QUIZ_ATTEMPT,
                    UserEvent::TYPE_QUIZ_COMPLETE,
                ])) {
                    $material = $allMaterials->random();
                    $materialId = $material->id;
                }

                if (in_array($eventType, [UserEvent::TYPE_QUIZ_ATTEMPT, UserEvent::TYPE_QUIZ_COMPLETE])) {
                    $metadata = ['score' => fake()->randomElement([70, 80, 85, 90, 100])];
                }

                UserEvent::create([
                    'user_id' => $user->id,
                    'course_id' => $course->id,
                    'material_id' => $materialId,
                    'event_type' => $eventType,
                    'metadata' => $metadata,
                    'created_at' => now()->subDays(rand(0, 28))->subHours(rand(0, 23)),
                ]);

                $totalCreated++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Successfully generated {$totalCreated} simulated events for {$targetUsersCount} users!");
        $this->comment('You can now run `php artisan recommendation:stats` to inspect the dataset metrics.');

        return Command::SUCCESS;
    }
}
