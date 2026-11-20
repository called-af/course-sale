<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PruneApplicationDataCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'system:prune-data
                            {--days= : Override the retention window (in days) for operational logs}';

    /**
     * @var string
     */
    protected $description = 'Prune expired sessions, cache rows, queue metadata and old operational logs.';

    public function handle(): int
    {
        $logDays = max(1, (int) ($this->option('days') ?: config('maintenance.retention_days.operational_logs')));
        $sessionDays = max(1, (int) config('maintenance.retention_days.sessions'));
        $batchDays = max(1, (int) config('maintenance.retention_days.job_batches'));
        $paymentDays = max(1, (int) config('maintenance.retention_days.payment_logs'));
        $chatDays = max(1, (int) config('maintenance.retention_days.chat_messages'));

        $deleted = 0;

        // Database sessions/cache may be unused when Redis is configured.
        $deleted += $this->prune('sessions', 'last_activity', now()->subDays($sessionDays)->getTimestamp());
        $deleted += $this->prune('cache', 'expiration', now()->getTimestamp());
        $deleted += $this->prune('cache_locks', 'expiration', now()->getTimestamp());
        $deleted += $this->prune('job_batches', 'created_at', now()->subDays($batchDays));

        // Operational logs. Payment logs are kept longer for finance audits.
        foreach (['user_events', 'ai_provider_logs', 'ai_usage_logs', 'whatsapp_webhooks', 'whatsapp_provider_logs', 'whatsapp_delivery_logs'] as $table) {
            $deleted += $this->prune($table, 'created_at', now()->subDays($logDays));
        }

        $deleted += $this->prune('payment_logs', 'created_at', now()->subDays($paymentDays));
        $deleted += $this->prune('chat_messages', 'created_at', now()->subDays($chatDays));

        $this->info("Pruned {$deleted} stale row(s).");

        return self::SUCCESS;
    }

    protected function prune(string $table, string $column, mixed $cutoff): int
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $column)) {
            return 0;
        }

        return DB::table($table)->where($column, '<', $cutoff)->delete();
    }
}
