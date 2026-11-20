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
        Schema::dropIfExists('payment_settings');

        DB::statement(<<<'SQL'
CREATE TABLE `payment_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `gateway` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'midtrans',
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IDR',
  `platform_fee_percent` decimal(6,2) NOT NULL DEFAULT '20.00',
  `payout_hold_days` smallint unsigned NOT NULL DEFAULT '7',
  `payout_minimum` decimal(12,2) NOT NULL DEFAULT '100000.00',
  `payout_account_lock_hours` smallint unsigned NOT NULL DEFAULT '24',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
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
        Schema::dropIfExists('payment_settings');
        Schema::enableForeignKeyConstraints();
    }
};
