<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_providers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('slug', 120)->unique();
            $table->string('driver', 60)->index();
            $table->string('base_url', 500)->nullable();
            $table->json('config')->nullable();
            $table->boolean('enabled')->default(true)->index();
            $table->boolean('is_default')->default(false)->index();
            $table->unsignedSmallInteger('fallback_priority')->default(100)->index();
            $table->unsignedSmallInteger('timeout')->default(30);
            $table->unsignedTinyInteger('max_retries')->default(1);
            $table->string('status', 30)->default('unknown');
            $table->timestamp('last_tested_at')->nullable();
            $table->text('last_error')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('ai_provider_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ai_provider_id')->constrained('ai_providers')->cascadeOnDelete();
            $table->string('key', 80);
            $table->text('value');
            $table->timestamps();

            $table->unique(['ai_provider_id', 'key']);
        });

        Schema::create('ai_models', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ai_provider_id')->constrained('ai_providers')->cascadeOnDelete();
            $table->string('model_id', 200);
            $table->string('name', 200)->nullable();
            $table->json('capabilities')->nullable();
            $table->unsignedInteger('context_window')->nullable();
            $table->unsignedInteger('max_output_tokens')->nullable();
            $table->boolean('is_default')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamp('discovered_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['ai_provider_id', 'model_id']);
        });

        Schema::create('ai_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('ai_provider_id')->nullable()->constrained('ai_providers')->nullOnDelete();
            $table->string('model', 200)->nullable();
            $table->string('title', 255)->nullable();
            $table->json('context')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('ai_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ai_conversation_id')->constrained('ai_conversations')->cascadeOnDelete();
            $table->string('role', 30)->index();
            $table->longText('content')->nullable();
            $table->json('tool_calls')->nullable();
            $table->json('attachments')->nullable();
            $table->string('provider_message_id', 200)->nullable();
            $table->json('usage')->nullable();
            $table->timestamps();
        });

        Schema::create('ai_usage_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ai_provider_id')->nullable()->constrained('ai_providers')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('model', 200)->nullable();
            $table->string('request_type', 30)->default('chat');
            $table->unsignedInteger('input_tokens')->default(0);
            $table->unsignedInteger('output_tokens')->default(0);
            $table->unsignedInteger('total_tokens')->default(0);
            $table->unsignedInteger('latency_ms')->default(0);
            $table->boolean('success')->default(true)->index();
            $table->string('error_code', 80)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['ai_provider_id', 'created_at']);
        });

        Schema::create('ai_provider_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ai_provider_id')->nullable()->constrained('ai_providers')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 60)->index();
            $table->string('status', 30)->default('success');
            $table->text('message')->nullable();
            $table->json('context')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamps();

            $table->index(['ai_provider_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_provider_logs');
        Schema::dropIfExists('ai_usage_logs');
        Schema::dropIfExists('ai_messages');
        Schema::dropIfExists('ai_conversations');
        Schema::dropIfExists('ai_models');
        Schema::dropIfExists('ai_provider_credentials');
        Schema::dropIfExists('ai_providers');
    }
};
