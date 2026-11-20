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
        Schema::dropIfExists('ai_setting_audits');

        DB::statement(<<<'SQL'
CREATE TABLE `ai_setting_audits` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ai_setting_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `changed_fields` json NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ai_setting_audits_ai_setting_id_foreign` (`ai_setting_id`),
  KEY `ai_setting_audits_user_id_foreign` (`user_id`),
  CONSTRAINT `ai_setting_audits_ai_setting_id_foreign` FOREIGN KEY (`ai_setting_id`) REFERENCES `ai_settings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ai_setting_audits_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
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
        Schema::dropIfExists('ai_setting_audits');
        Schema::enableForeignKeyConstraints();
    }
};
