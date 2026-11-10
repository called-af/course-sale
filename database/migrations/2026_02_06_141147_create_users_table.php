<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->enum('role', ['student', 'instructor', 'admin'])->nullable();
            $table->string('avatar')->nullable();
            $table->string('whatsapp_number')->nullable();
            $table->boolean('whatsapp_notification_enabled')->default(false);
            $table->timestamp('email_verified_at')->nullable();
            // Instructor payout account. The account number is stored encrypted,
            // so it uses TEXT instead of a short VARCHAR.
            $table->string('payout_bank_name', 60)->nullable();
            $table->text('payout_account_number')->nullable();
            $table->string('payout_account_name', 120)->nullable();
            $table->timestamp('payout_account_updated_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
