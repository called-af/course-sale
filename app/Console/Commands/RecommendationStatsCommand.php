<?php

namespace App\Console\Commands;

use App\Services\RecommendationAnalyticsService;
use Illuminate\Console\Command;

class RecommendationStatsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'recommendation:stats
                            {--json : Output result as raw JSON}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Track active user count, event distributions, matrix sparsity, and Phase 3 ML gate-check readiness';

    /**
     * Execute the console command.
     */
    public function handle(RecommendationAnalyticsService $analyticsService): int
    {
        $data = $analyticsService->getAnalytics();

        if ($this->option('json')) {
            $this->line(json_encode($data, JSON_PRETTY_PRINT));

            return Command::SUCCESS;
        }

        $this->info('===============================================================');
        $this->info('         KURSUSIO — RECOMMENDATION DATA & ML READINESS         ');
        $this->info('===============================================================');

        // 1. Overview Table
        $this->newLine();
        $this->comment('1. Overview & Dataset Density:');
        $this->table(
            ['Metric', 'Value'],
            [
                ['Total Registered Users', $data['overview']['total_users']],
                ['Active Users (>= 1 event)', $data['overview']['active_users']],
                ['Inactive Users (0 events)', $data['overview']['inactive_users']],
                ['Total Courses', $data['overview']['total_courses']],
                ['Published Courses', $data['overview']['published_courses']],
                ['Total Tracked Events', $data['overview']['total_events']],
                ['Unique (User, Course) Pairs', $data['overview']['unique_user_course_interactions']],
                ['User-Course Matrix Sparsity', $data['overview']['matrix_sparsity_percentage'] . '%'],
            ]
        );

        // 2. Events By Type Table
        $this->newLine();
        $this->comment('2. Events Breakdown by Type:');
        $eventRows = [];
        foreach ($data['events_by_type'] as $type => $count) {
            $pct = $data['overview']['total_events'] > 0
                ? round(($count / $data['overview']['total_events']) * 100, 1) . '%'
                : '0%';
            $eventRows[] = [$type, $count, $pct];
        }
        $this->table(['Event Type', 'Count', 'Percentage'], ! empty($eventRows) ? $eventRows : [['No events recorded yet', 0, '0%']]);

        // 3. User Engagement & Distribution
        $this->newLine();
        $this->comment('3. User Interaction Distribution:');
        $this->table(
            ['Interaction Range', 'User Count', 'Description'],
            [
                ['0 events', $data['distribution']['inactive_0_events'], 'Inactive users (Cold start)'],
                ['1 - 4 events', $data['distribution']['sparse_1_to_4_events'], 'Sparse interactions (< 5 threshold)'],
                ['5 - 10 events', $data['distribution']['moderate_5_to_10_events'], 'Moderate activity (Collaborative viable)'],
                ['11 - 25 events', $data['distribution']['active_11_to_25_events'], 'Active learners'],
                ['> 25 events', $data['distribution']['rich_25_plus_events'], 'Power learners (Rich profile)'],
            ]
        );

        $this->line("  * Average events per active user : <info>{$data['user_engagement']['avg_per_active_user']}</info>");
        $this->line("  * Median events per active user  : <info>{$data['user_engagement']['median_events']}</info>");
        $this->line("  * Active users with >= 5 events  : <comment>{$data['distribution']['pct_active_users_5_or_more']}%</comment> ({$data['distribution']['pct_active_users_under_5']}% have < 5 events)");

        // 4. Gate Check Evaluation
        $this->newLine();
        $this->comment('4. Phase 3 Gate Check (ML Readiness for Collaborative Filtering):');

        $gateRows = [];
        foreach ($data['gate_check']['criteria'] as $c) {
            $status = $c['passed'] ? '<fg=green>PASS</>' : '<fg=red>FAIL</>';
            $gateRows[] = [$c['name'], $c['target'], $c['actual'], $status];
        }
        $this->table(['Gate Criterion', 'Target Requirement', 'Actual Value', 'Status'], $gateRows);

        $this->newLine();
        if ($data['gate_check']['is_ready_for_ml']) {
            $this->info('===============================================================');
            $this->info('  [VERDICT] READY FOR PHASE 4 (Python Collaborative Filtering) ');
            $this->info('===============================================================');
            $this->line($data['gate_check']['message']);
            $this->comment('Next step: Export dataset with `php artisan recommendation:export` and train Python model.');
        } else {
            $this->warn('===============================================================');
            $this->warn('  [VERDICT] STAY ON PHASE 2 BASELINE (Content-Based Tag/Popular) ');
            $this->warn('===============================================================');
            $this->line($data['gate_check']['message']);
            $this->comment('Recommendation: Continue tracking events until active users achieve >= 5 events.');
        }
        $this->newLine();

        return Command::SUCCESS;
    }
}
