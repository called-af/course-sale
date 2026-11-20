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
        Schema::dropIfExists('whatsapp_messages');

        DB::statement(<<<'SQL'
CREATE TABLE `whatsapp_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `whatsapp_provider_id` bigint unsigned DEFAULT NULL,
  `whatsapp_conversation_id` bigint unsigned DEFAULT NULL,
  `whatsapp_contact_id` bigint unsigned DEFAULT NULL,
  `direction` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'outbound',
  `type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `to` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `from` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body` text COLLATE utf8mb4_unicode_ci,
  `media_url` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `template_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider_message_id` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'queued',
  `idempotency_key` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `payload` json DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `whatsapp_messages_idempotency_key_unique` (`idempotency_key`),
  KEY `whatsapp_messages_whatsapp_conversation_id_foreign` (`whatsapp_conversation_id`),
  KEY `whatsapp_messages_whatsapp_contact_id_foreign` (`whatsapp_contact_id`),
  KEY `whatsapp_messages_whatsapp_provider_id_created_at_index` (`whatsapp_provider_id`,`created_at`),
  KEY `whatsapp_messages_direction_index` (`direction`),
  KEY `whatsapp_messages_provider_message_id_index` (`provider_message_id`),
  KEY `whatsapp_messages_status_index` (`status`),
  CONSTRAINT `whatsapp_messages_whatsapp_contact_id_foreign` FOREIGN KEY (`whatsapp_contact_id`) REFERENCES `whatsapp_contacts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `whatsapp_messages_whatsapp_conversation_id_foreign` FOREIGN KEY (`whatsapp_conversation_id`) REFERENCES `whatsapp_conversations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `whatsapp_messages_whatsapp_provider_id_foreign` FOREIGN KEY (`whatsapp_provider_id`) REFERENCES `whatsapp_providers` (`id`) ON DELETE SET NULL
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
        Schema::dropIfExists('whatsapp_messages');
        Schema::enableForeignKeyConstraints();
    }
};
