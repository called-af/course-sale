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
        Schema::dropIfExists('whatsapp_conversations');

        DB::statement(<<<'SQL'
CREATE TABLE `whatsapp_conversations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `whatsapp_provider_id` bigint unsigned DEFAULT NULL,
  `whatsapp_account_id` bigint unsigned DEFAULT NULL,
  `whatsapp_contact_id` bigint unsigned DEFAULT NULL,
  `external_conversation_id` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `last_message_at` timestamp NULL DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `whatsapp_conversations_whatsapp_account_id_foreign` (`whatsapp_account_id`),
  KEY `whatsapp_conversations_whatsapp_contact_id_foreign` (`whatsapp_contact_id`),
  KEY `wa_conversations_provider_last_message_idx` (`whatsapp_provider_id`,`last_message_at`),
  CONSTRAINT `whatsapp_conversations_whatsapp_account_id_foreign` FOREIGN KEY (`whatsapp_account_id`) REFERENCES `whatsapp_accounts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `whatsapp_conversations_whatsapp_contact_id_foreign` FOREIGN KEY (`whatsapp_contact_id`) REFERENCES `whatsapp_contacts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `whatsapp_conversations_whatsapp_provider_id_foreign` FOREIGN KEY (`whatsapp_provider_id`) REFERENCES `whatsapp_providers` (`id`) ON DELETE SET NULL
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
        Schema::dropIfExists('whatsapp_conversations');
        Schema::enableForeignKeyConstraints();
    }
};
