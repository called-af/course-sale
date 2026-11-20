<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('ai_usage_logs');

        DB::statement(<<<'SQL'
CREATE TABLE `ai_usage_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ai_provider_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `model` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `request_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'chat',
  `input_tokens` int unsigned NOT NULL DEFAULT '0',
  `output_tokens` int unsigned NOT NULL DEFAULT '0',
  `total_tokens` int unsigned NOT NULL DEFAULT '0',
  `latency_ms` int unsigned NOT NULL DEFAULT '0',
  `success` tinyint(1) NOT NULL DEFAULT '1',
  `error_code` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ai_usage_logs_user_id_foreign` (`user_id`),
  KEY `ai_usage_logs_ai_provider_id_created_at_index` (`ai_provider_id`,`created_at`),
  KEY `ai_usage_logs_success_index` (`success`),
  CONSTRAINT `ai_usage_logs_ai_provider_id_foreign` FOREIGN KEY (`ai_provider_id`) REFERENCES `ai_providers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ai_usage_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SQL);

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('ai_usage_logs');
        Schema::enableForeignKeyConstraints();
    }
};
