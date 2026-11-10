<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_settings', function (Blueprint $table) {
            $table->id();
            $table->string('gateway', '20')->default('midtrans');
            $table->string('currency', '10')->default('IDR');
            $table->decimal('platform_fee_percent', 6, 2)->default(20);
            $table->unsignedSmallInteger('payout_hold_days')->default(7);
            $table->decimal('payout_minimum', 12, 2)->default(100000);
            $table->unsignedSmallInteger('payout_account_lock_hours')->default(24);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_settings');
    }
};
