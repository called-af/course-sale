<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_setting_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ai_setting_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('ip', 45)->nullable();
            $table->json('changed_fields');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_setting_audits');
    }
};
