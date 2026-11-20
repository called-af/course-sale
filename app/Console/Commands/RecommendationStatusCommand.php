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
    protected $description = 'Check Laravel-native recommendation system status and generate a test result';

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
            ['Configuration', 'Value'],
            [
                ['Master switch (RECOMMENDATION_ENABLED)', $status['enabled'] ? '<info>ENABLED</info>' : '<comment>DISABLED</comment>'],
                ['Admin recommendation toggle', $status['admin_enabled'] ? '<info>ENABLED</info>' : '<comment>DISABLED</comment>'],
                ['Active engine', '<info>'.$status['active_engine'].'</info>'],
                ['Cache TTL (seconds)', (string) $status['cache_ttl']],
                ['Cache store', (string) $status['cache_store']],
            ]
        );

        $this->newLine();
        $this->info('Running recommendation generation test:');
        $limit = (int) $this->option('limit');
        $userId = $this->option('user');
        $user = $userId ? User::find($userId) : User::first();

        $targetLabel = $user ? "User ID: {$user->id} ({$user->name})" : 'Guest (Unauthenticated)';
        $this->line("Target: <comment>{$targetLabel}</comment> | Limit: <comment>{$limit}</comment>");

        $startTime = microtime(true);
        $results = $recommendationService->getRecommendations($user, $limit);
        $elapsedMs = round((microtime(true) - $startTime) * 1000, 2);

        $this->line("Execution time: <info>{$elapsedMs} ms</info>");
        $this->line('Items returned: <info>'.count($results).'</info>');

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
            $this->table(['Course ID', 'Title', 'Score', 'Reason', 'Tags'], $rows);
        } else {
            $this->warn('No recommendations returned (disabled or catalog/interaction data empty).');
        }

        $this->newLine();

        return Command::SUCCESS;
    }
}
