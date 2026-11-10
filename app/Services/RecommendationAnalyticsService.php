<?php

namespace App\Services;

use App\Models\Course;
use App\Models\User;
use App\Models\UserEvent;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class RecommendationAnalyticsService
{
    /**
     * Event weight mapping for implicit ratings.
     */
    public const EVENT_WEIGHTS = [
        UserEvent::TYPE_COURSE_ENROLL => 5.0,
        UserEvent::TYPE_QUIZ_COMPLETE => 4.0,
        UserEvent::TYPE_MATERIAL_COMPLETE => 4.0,
        UserEvent::TYPE_QUIZ_ATTEMPT => 3.0,
        UserEvent::TYPE_MATERIAL_VIEW => 2.0,
        UserEvent::TYPE_COURSE_VIEW => 1.0,
    ];

    /**
     * Calculate comprehensive analytics and gate-check readiness.
     */
    public function getAnalytics(): array
    {
        $totalUsers = User::count();
        $totalCourses = Course::count();
        $publishedCourses = Course::where('status', 'published')->count();
        $totalEvents = UserEvent::count();

        // Event counts grouped by event_type
        $eventCountsByType = UserEvent::select('event_type', DB::raw('COUNT(*) as count'))
            ->groupBy('event_type')
            ->pluck('count', 'event_type')
            ->toArray();

        // Events per user breakdown
        $userEventCounts = UserEvent::select('user_id', DB::raw('COUNT(*) as total_events'))
            ->groupBy('user_id')
            ->pluck('total_events', 'user_id')
            ->toArray();

        $activeUsersCount = count($userEventCounts);
        $inactiveUsersCount = max(0, $totalUsers - $activeUsersCount);

        $eventsArray = array_values($userEventCounts);
        $avgEventsPerActiveUser = $activeUsersCount > 0 ? round($totalEvents / $activeUsersCount, 2) : 0;
        $avgEventsPerTotalUser = $totalUsers > 0 ? round($totalEvents / $totalUsers, 2) : 0;
        $maxEvents = ! empty($eventsArray) ? max($eventsArray) : 0;
        $minEvents = ! empty($eventsArray) ? min($eventsArray) : 0;
        $medianEvents = $this->calculateMedian($eventsArray);

        // Distribution of events per user
        $usersUnder5 = 0;
        $users5to10 = 0;
        $users11to25 = 0;
        $usersAbove25 = 0;

        foreach ($eventsArray as $count) {
            if ($count < 5) {
                $usersUnder5++;
            } elseif ($count <= 10) {
                $users5to10++;
            } elseif ($count <= 25) {
                $users11to25++;
            } else {
                $usersAbove25++;
            }
        }

        $pctUnder5OfActive = $activeUsersCount > 0 ? round(($usersUnder5 / $activeUsersCount) * 100, 1) : 0;
        $pct5OrMoreOfActive = $activeUsersCount > 0 ? round((($activeUsersCount - $usersUnder5) / $activeUsersCount) * 100, 1) : 0;

        // Unique User-Course interaction pairs
        $uniquePairs = UserEvent::whereNotNull('course_id')
            ->distinct()
            ->count(DB::raw('CONCAT(user_id, "-", course_id)'));

        $totalPossiblePairs = ($totalUsers > 0 && $totalCourses > 0) ? ($totalUsers * $totalCourses) : 1;
        $sparsityPct = round((1 - ($uniquePairs / $totalPossiblePairs)) * 100, 2);

        // Gate check evaluation for ML Collaborative Filtering
        $gateCheck = $this->evaluateGateCheck(
            $totalEvents,
            $activeUsersCount,
            $usersUnder5,
            $pct5OrMoreOfActive,
            $uniquePairs
        );

        return [
            'overview' => [
                'total_users' => $totalUsers,
                'active_users' => $activeUsersCount,
                'inactive_users' => $inactiveUsersCount,
                'total_courses' => $totalCourses,
                'published_courses' => $publishedCourses,
                'total_events' => $totalEvents,
                'unique_user_course_interactions' => $uniquePairs,
                'matrix_sparsity_percentage' => $sparsityPct,
            ],
            'events_by_type' => $eventCountsByType,
            'user_engagement' => [
                'avg_per_active_user' => $avgEventsPerActiveUser,
                'avg_per_total_user' => $avgEventsPerTotalUser,
                'median_events' => $medianEvents,
                'min_events' => $minEvents,
                'max_events' => $maxEvents,
            ],
            'distribution' => [
                'inactive_0_events' => $inactiveUsersCount,
                'sparse_1_to_4_events' => $usersUnder5,
                'moderate_5_to_10_events' => $users5to10,
                'active_11_to_25_events' => $users11to25,
                'rich_25_plus_events' => $usersAbove25,
                'pct_active_users_under_5' => $pctUnder5OfActive,
                'pct_active_users_5_or_more' => $pct5OrMoreOfActive,
            ],
            'gate_check' => $gateCheck,
        ];
    }

    /**
     * Evaluate Phase 3 Gate Check for ML readiness.
     */
    protected function evaluateGateCheck(
        int $totalEvents,
        int $activeUsersCount,
        int $usersUnder5,
        float $pct5OrMoreOfActive,
        int $uniquePairs
    ): array {
        $criteria = [
            [
                'name' => 'Minimum Total Events',
                'target' => '>= 100 events',
                'actual' => "{$totalEvents} events",
                'passed' => $totalEvents >= 100,
            ],
            [
                'name' => 'Active Users Count',
                'target' => '>= 10 users',
                'actual' => "{$activeUsersCount} active users",
                'passed' => $activeUsersCount >= 10,
            ],
            [
                'name' => 'Rule of Thumb (>= 5 events/user)',
                'target' => '>= 50% active users have >= 5 events',
                'actual' => "{$pct5OrMoreOfActive}% have >= 5 events",
                'passed' => $pct5OrMoreOfActive >= 50.0 && $activeUsersCount >= 5,
            ],
            [
                'name' => 'Distinct User-Course Pairs',
                'target' => '>= 30 interaction pairs',
                'actual' => "{$uniquePairs} pairs",
                'passed' => $uniquePairs >= 30,
            ],
        ];

        $passedCount = count(array_filter($criteria, fn ($c) => $c['passed']));
        $isReady = $passedCount === count($criteria);

        if ($isReady) {
            $verdict = 'READY_FOR_PHASE_4';
            $message = 'Sufficient interaction data gathered. Collaborative filtering model in Python is viable.';
        } else {
            $verdict = 'STAY_ON_PHASE_2_BASELINE';
            $message = 'Insufficient interaction density. Most users have < 5 events. Stay on Phase 2 Baseline (Content-Based / Popularity) until more user data is accumulated.';
        }

        return [
            'is_ready_for_ml' => $isReady,
            'verdict' => $verdict,
            'message' => $message,
            'criteria' => $criteria,
        ];
    }

    /**
     * Export all required datasets to CSV for offline training & ML experimentation.
     */
    public function exportData(string $outputDir): array
    {
        if (! File::exists($outputDir)) {
            File::makeDirectory($outputDir, 0755, true);
        }

        $eventsFile = $outputDir.DIRECTORY_SEPARATOR.'events.csv';
        $interactionsFile = $outputDir.DIRECTORY_SEPARATOR.'user_item_matrix.csv';
        $coursesFile = $outputDir.DIRECTORY_SEPARATOR.'courses.csv';
        $summaryFile = $outputDir.DIRECTORY_SEPARATOR.'dataset_summary.json';

        // 1. Export Raw Events
        $eventsCount = $this->exportRawEvents($eventsFile);

        // 2. Export Aggregated User-Item Matrix with Implicit Weights
        $interactionsCount = $this->exportUserItemMatrix($interactionsFile);

        // 3. Export Course Catalog
        $coursesCount = $this->exportCoursesCatalog($coursesFile);

        // 4. Save Analytics Summary
        $analytics = $this->getAnalytics();
        $analytics['exported_at'] = now()->toIso8601String();
        $analytics['files'] = [
            'events_csv' => $eventsFile,
            'user_item_matrix_csv' => $interactionsFile,
            'courses_csv' => $coursesFile,
        ];
        File::put($summaryFile, json_encode($analytics, JSON_PRETTY_PRINT));

        return [
            'directory' => $outputDir,
            'events_file' => $eventsFile,
            'events_count' => $eventsCount,
            'interactions_file' => $interactionsFile,
            'interactions_count' => $interactionsCount,
            'courses_file' => $coursesFile,
            'courses_count' => $coursesCount,
            'summary_file' => $summaryFile,
            'analytics' => $analytics,
        ];
    }

    /**
     * Export raw events table to CSV.
     */
    protected function exportRawEvents(string $filePath): int
    {
        $handle = fopen($filePath, 'w');
        fputcsv($handle, ['id', 'user_id', 'course_id', 'material_id', 'event_type', 'metadata', 'created_at']);

        $count = 0;
        UserEvent::orderBy('id')->chunk(500, function ($events) use ($handle, &$count) {
            foreach ($events as $event) {
                fputcsv($handle, [
                    $event->id,
                    $event->user_id,
                    $event->course_id,
                    $event->material_id,
                    $event->event_type,
                    $event->metadata ? json_encode($event->metadata) : '',
                    $event->created_at?->toIso8601String(),
                ]);
                $count++;
            }
        });

        fclose($handle);

        return $count;
    }

    /**
     * Export implicit user-course interaction matrix with weighted scores.
     */
    protected function exportUserItemMatrix(string $filePath): int
    {
        $handle = fopen($filePath, 'w');
        fputcsv($handle, ['user_id', 'course_id', 'implicit_weight', 'interaction_count', 'last_interacted_at']);

        $events = UserEvent::whereNotNull('course_id')
            ->select('user_id', 'course_id', 'event_type', 'created_at')
            ->get();

        $matrix = [];
        foreach ($events as $event) {
            $key = "{$event->user_id}_{$event->course_id}";
            $weight = self::EVENT_WEIGHTS[$event->event_type] ?? 1.0;

            if (! isset($matrix[$key])) {
                $matrix[$key] = [
                    'user_id' => $event->user_id,
                    'course_id' => $event->course_id,
                    'implicit_weight' => 0.0,
                    'interaction_count' => 0,
                    'last_interacted_at' => $event->created_at,
                ];
            }

            $matrix[$key]['implicit_weight'] += $weight;
            $matrix[$key]['interaction_count']++;

            if ($event->created_at > $matrix[$key]['last_interacted_at']) {
                $matrix[$key]['last_interacted_at'] = $event->created_at;
            }
        }

        $count = 0;
        foreach ($matrix as $row) {
            fputcsv($handle, [
                $row['user_id'],
                $row['course_id'],
                round($row['implicit_weight'], 2),
                $row['interaction_count'],
                $row['last_interacted_at']?->toIso8601String(),
            ]);
            $count++;
        }

        fclose($handle);

        return $count;
    }

    /**
     * Export courses catalog with categories and tags.
     */
    protected function exportCoursesCatalog(string $filePath): int
    {
        $handle = fopen($filePath, 'w');
        fputcsv($handle, [
            'course_id',
            'title',
            'slug',
            'price',
            'level',
            'status',
            'rating_avg',
            'rating_count',
            'category_ids',
            'category_names',
            'tag_ids',
            'tag_names',
            'created_at',
        ]);

        $count = 0;
        Course::with(['categories:id,name', 'tags:id,name'])
            ->orderBy('id')
            ->chunk(200, function ($courses) use ($handle, &$count) {
                foreach ($courses as $course) {
                    $catIds = $course->categories->pluck('id')->implode('|');
                    $catNames = $course->categories->pluck('name')->implode('|');
                    $tagIds = $course->tags->pluck('id')->implode('|');
                    $tagNames = $course->tags->pluck('name')->implode('|');

                    fputcsv($handle, [
                        $course->id,
                        $course->title,
                        $course->slug,
                        $course->price,
                        $course->level,
                        $course->status,
                        $course->rating_avg ?? 0.0,
                        $course->rating_count ?? 0,
                        $catIds,
                        $catNames,
                        $tagIds,
                        $tagNames,
                        $course->created_at?->toIso8601String(),
                    ]);
                    $count++;
                }
            });

        fclose($handle);

        return $count;
    }

    /**
     * Calculate median of array.
     */
    protected function calculateMedian(array $numbers): float
    {
        if (empty($numbers)) {
            return 0.0;
        }

        sort($numbers);
        $count = count($numbers);
        $middle = (int) floor($count / 2);

        if ($count % 2 === 0) {
            return round(($numbers[$middle - 1] + $numbers[$middle]) / 2, 2);
        }

        return round($numbers[$middle], 2);
    }
}
