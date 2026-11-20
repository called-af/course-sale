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
        Schema::dropIfExists('whatsapp_provider_credentials');

        DB::statement(<<<'SQL'
CREATE TABLE `whatsapp_provider_credentials` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `whatsapp_provider_id` bigint unsigned NOT NULL,
  `key` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `whatsapp_provider_credentials_whatsapp_provider_id_key_unique` (`whatsapp_provider_id`,`key`),
  CONSTRAINT `whatsapp_provider_credentials_whatsapp_provider_id_foreign` FOREIGN KEY (`whatsapp_provider_id`) REFERENCES `whatsapp_providers` (`id`) ON DELETE CASCADE
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
        Schema::dropIfExists('whatsapp_provider_credentials');
        Schema::enableForeignKeyConstraints();
    }
};
