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
        Schema::dropIfExists('quiz_attempts');

        DB::statement(<<<'SQL'
CREATE TABLE `quiz_attempts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `material_content_id` bigint unsigned NOT NULL,
  `started_at` timestamp NOT NULL,
  `finished_at` timestamp NULL DEFAULT NULL,
  `time_spent` int DEFAULT NULL,
  `score` decimal(5,2) DEFAULT NULL,
  `needs_review` tinyint(1) NOT NULL DEFAULT '0',
  `reviewed_by` bigint unsigned DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `status` enum('in_progress','completed','expired') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `quiz_attempts_reviewed_by_foreign` (`reviewed_by`),
  KEY `quiz_attempts_user_id_index` (`user_id`),
  KEY `quiz_attempts_material_content_id_index` (`material_content_id`),
  CONSTRAINT `quiz_attempts_material_content_id_foreign` FOREIGN KEY (`material_content_id`) REFERENCES `material_contents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `quiz_attempts_reviewed_by_foreign` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `quiz_attempts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
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
        Schema::dropIfExists('quiz_attempts');
        Schema::enableForeignKeyConstraints();
    }
};
