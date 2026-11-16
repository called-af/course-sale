<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_provider_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('whatsapp_provider_id')->nullable()->constrained('whatsapp_providers')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 60)->index();
            $table->string('status', 30)->default('success');
            $table->text('message')->nullable();
            $table->json('context')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamps();

            $table->index(['whatsapp_provider_id', 'created_at'], 'wa_provider_logs_provider_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_provider_logs');
    }
};
