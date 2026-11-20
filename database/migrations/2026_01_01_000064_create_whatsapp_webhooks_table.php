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
        Schema::dropIfExists('whatsapp_webhooks');

        DB::statement(<<<'SQL'
CREATE TABLE `whatsapp_webhooks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `whatsapp_provider_id` bigint unsigned DEFAULT NULL,
  `event` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unknown',
  `provider_event` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider_message_id` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'processed',
  `error` text COLLATE utf8mb4_unicode_ci,
  `payload` json DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `whatsapp_webhooks_whatsapp_provider_id_created_at_index` (`whatsapp_provider_id`,`created_at`),
  CONSTRAINT `whatsapp_webhooks_whatsapp_provider_id_foreign` FOREIGN KEY (`whatsapp_provider_id`) REFERENCES `whatsapp_providers` (`id`) ON DELETE SET NULL
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
        Schema::dropIfExists('whatsapp_webhooks');
        Schema::enableForeignKeyConstraints();
    }
};
