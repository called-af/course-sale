<?php

namespace App\Console\Commands;

use App\Services\RecommendationAnalyticsService;
use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class RecommendationTrainCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'recommendation:train
                            {--no-export : Skip exporting datasets before training}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Trigger offline retraining of Python ML Collaborative Filtering & Similarity models';

    /**
     * Execute the console command.
     */
    public function handle(RecommendationAnalyticsService $analyticsService): int
    {
        $this->info('===============================================================');
        $this->info('        KURSUSIO — PYTHON ML OFFLINE MODEL RETRAINING          ');
        $this->info('===============================================================');

        if (! $this->option('no-export')) {
            $this->info('Step 1: Exporting latest interaction datasets to storage/app/ml ...');
            $outputDir = storage_path('app/ml');
            $result = $analyticsService->exportData($outputDir);
            $this->line("  -> Events exported: <info>{$result['events_count']}</info>");
            $this->line("  -> User-Item pairs: <info>{$result['interactions_count']}</info>");
            $this->line("  -> Courses in catalog: <info>{$result['courses_count']}</info>");
            $this->newLine();
        }

        $this->info('Step 2: Running Python training script (ml/train.py) ...');
        $pythonBinary = base_path('recommendation-service/venv/bin/python');
        $trainScript = base_path('recommendation-service/ml/train.py');

        if (! file_exists($pythonBinary)) {
            $pythonBinary = 'python3';
        }

        $process = new Process([$pythonBinary, $trainScript], base_path('recommendation-service'));
        $process->setTimeout(120);
        $process->run();

        if (! $process->isSuccessful()) {
            $this->error('Python model training failed!');
            $this->line($process->getErrorOutput());

            return Command::FAILURE;
        }

        $this->info($process->getOutput());
        $this->info('Model retraining finished successfully!');
        $this->line('Model artifacts saved at: <comment>recommendation-service/models/recommender_model.pkl</comment>');
        $this->newLine();

        return Command::SUCCESS;
    }
}
