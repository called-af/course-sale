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
        Schema::dropIfExists('whatsapp_delivery_logs');

        DB::statement(<<<'SQL'
CREATE TABLE `whatsapp_delivery_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `whatsapp_message_id` bigint unsigned DEFAULT NULL,
  `whatsapp_provider_id` bigint unsigned DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_status` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `payload` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `whatsapp_delivery_logs_whatsapp_provider_id_foreign` (`whatsapp_provider_id`),
  KEY `whatsapp_delivery_logs_whatsapp_message_id_created_at_index` (`whatsapp_message_id`,`created_at`),
  CONSTRAINT `whatsapp_delivery_logs_whatsapp_message_id_foreign` FOREIGN KEY (`whatsapp_message_id`) REFERENCES `whatsapp_messages` (`id`) ON DELETE SET NULL,
  CONSTRAINT `whatsapp_delivery_logs_whatsapp_provider_id_foreign` FOREIGN KEY (`whatsapp_provider_id`) REFERENCES `whatsapp_providers` (`id`) ON DELETE SET NULL
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
        Schema::dropIfExists('whatsapp_delivery_logs');
        Schema::enableForeignKeyConstraints();
    }
};
