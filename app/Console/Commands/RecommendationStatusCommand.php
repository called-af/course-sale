<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\RecommendationService;
use Illuminate\Console\Command;

class RecommendationStatusCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'recommendation:status
                            {--user= : Optional user ID to test recommendation generation}
                            {--limit=4 : Number of courses to recommend in the test}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check recommendation system configuration, Python service connectivity, and fallback status';

    /**
     * Execute the console command.
     */
    public function handle(RecommendationService $recommendationService): int
    {
        $this->info('===============================================================');
        $this->info('             KURSUSIO RECOMMENDATION SYSTEM STATUS             ');
        $this->info('===============================================================');

        $status = $recommendationService->getStatus();

        $this->table(
            ['Configuration Setting', 'Value'],
            [
                ['Master Switch (RECOMMENDATION_ENABLED)', $status['enabled'] ? '<info>ENABLED (true)</info>' : '<comment>DISABLED (false)</comment>'],
                ['Admin Python Recommendation Toggle', $status['admin_enabled'] ? '<info>ENABLED (true)</info>' : '<comment>DISABLED (false)</comment>'],
                ['Configured Driver (RECOMMENDATION_DRIVER)', "<info>{$status['driver']}</info>"],
                ['Python Service URL', $status['python_url']],
                ['Python Service Connectivity', $status['python_online'] ? '<info>ONLINE (Connected)</info>' : '<fg=red>OFFLINE (Unreachable / Stopped)</>'],
                ['Fallback to Laravel (if Python down)', $status['fallback_to_laravel'] ? '<info>ENABLED (Automatic fallback to PHP engine)</info>' : '<comment>DISABLED</comment>'],
                ['Active Serving Engine', "<info>{$status['active_engine']}</info>"],
            ]
        );

        if ($status['python_online'] && ! empty($status['python_health'])) {
            $this->newLine();
            $this->info('Python ML Service Metadata:');
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Engine', $status['python_health']['engine'] ?? 'FastAPI'],
                    ['Model Loaded', ($status['python_health']['model_loaded'] ?? false) ? 'YES' : 'NO'],
                    ['Courses in Catalog', $status['python_health']['total_courses_in_catalog'] ?? 0],
                    ['Users in Interaction Matrix', $status['python_health']['total_users_in_matrix'] ?? 0],
                ]
            );
        }

        // Test Recommendation Generation
        $this->newLine();
        $this->info('Running Recommendation Generation Test:');
        $limit = (int) $this->option('limit');
        $userId = $this->option('user');
        $user = $userId ? User::find($userId) : User::first();

        $targetLabel = $user ? "User ID: {$user->id} ({$user->name})" : 'Guest (Unauthenticated)';
        $this->line("Target: <comment>{$targetLabel}</comment> | Limit: <comment>{$limit}</comment>");

        $startTime = microtime(true);
        $results = $recommendationService->getRecommendations($user, $limit);
        $elapsedMs = round((microtime(true) - $startTime) * 1000, 2);

        $this->line("Execution Time: <info>{$elapsedMs} ms</info>");
        $this->line('Items Returned: <info>'.count($results).'</info>');

        if (! empty($results)) {
            $rows = [];
            foreach ($results as $item) {
                $tags = is_array($item['matching_tags'] ?? null) ? implode(', ', $item['matching_tags']) : '';
                $rows[] = [
                    $item['id'] ?? '-',
                    $item['title'] ?? '-',
                    $item['recommendation_score'] ?? '-',
                    $item['recommendation_reason'] ?? '-',
                    $tags,
                ];
            }
            $this->table(
                ['Course ID', 'Title', 'Score', 'Reason', 'Tags'],
                $rows
            );
        } else {
            $this->warn('No recommendations returned (either disabled or catalog empty).');
        }

        $this->newLine();

        return Command::SUCCESS;
    }
}
