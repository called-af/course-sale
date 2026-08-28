<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class RecommendationEvaluateCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'recommendation:evaluate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Evaluate Python Collaborative Filtering & ALS models against baseline (Precision@K, Recall@K, HitRate@K, MRR@K)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Running ML Evaluation Benchmark across Baselines vs Collaborative Filtering...');

        $pythonBinary = base_path('recommendation-service/venv/bin/python');
        $evalScript = base_path('recommendation-service/ml/evaluate.py');

        if (! file_exists($pythonBinary)) {
            $pythonBinary = 'python3';
        }

        $process = new Process([$pythonBinary, $evalScript], base_path('recommendation-service'));
        $process->setTimeout(120);
        $process->run();

        if (! $process->isSuccessful()) {
            $this->error('Evaluation benchmark failed!');
            $this->line($process->getErrorOutput());

            return Command::FAILURE;
        }

        $this->line($process->getOutput());

        return Command::SUCCESS;
    }
}
