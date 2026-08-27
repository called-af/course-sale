<?php

namespace App\Console\Commands;

use App\Services\RecommendationAnalyticsService;
use Illuminate\Console\Command;

class ExportRecommendationDataCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'recommendation:export
                            {--path= : Output directory path (default: storage/app/ml)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Export event data, user-item interaction matrix, and course catalog to CSV for Phase 4 Python ML training';

    /**
     * Execute the console command.
     */
    public function handle(RecommendationAnalyticsService $analyticsService): int
    {
        $outputDir = $this->option('path') ?: storage_path('app/ml');

        $this->info("Exporting recommendation datasets to: {$outputDir} ...");

        $result = $analyticsService->exportData($outputDir);

        $this->newLine();
        $this->info('Export completed successfully!');
        $this->table(
            ['Dataset File', 'Rows Exported', 'File Path'],
            [
                ['Raw User Events (events.csv)', $result['events_count'], $result['events_file']],
                ['User-Item Matrix (user_item_matrix.csv)', $result['interactions_count'], $result['interactions_file']],
                ['Course Catalog (courses.csv)', $result['courses_count'], $result['courses_file']],
                ['Analytics Meta (dataset_summary.json)', '1 summary', $result['summary_file']],
            ]
        );

        $gateCheck = $result['analytics']['gate_check'];
        $this->newLine();
        $this->line("Gate Check Status : <comment>{$gateCheck['verdict']}</comment>");
        $this->line("Summary Note      : {$gateCheck['message']}");
        $this->newLine();

        return Command::SUCCESS;
    }
}
