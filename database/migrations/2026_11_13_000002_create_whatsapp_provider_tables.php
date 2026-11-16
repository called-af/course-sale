<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_providers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('slug', 120)->unique();
            $table->string('driver', 60)->index();
            $table->string('base_url', 500)->nullable();
            $table->json('config')->nullable();
            $table->boolean('enabled')->default(true)->index();
            $table->boolean('is_default')->default(false)->index();
            $table->unsignedSmallInteger('timeout')->default(15);
            $table->unsignedTinyInteger('max_retries')->default(1);
            $table->string('status', 30)->default('unknown');
            $table->timestamp('last_tested_at')->nullable();
            $table->text('last_error')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('whatsapp_provider_credentials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('whatsapp_provider_id')->constrained('whatsapp_providers')->cascadeOnDelete();
            $table->string('key', 80);
            $table->text('value');
            $table->timestamps();

            $table->unique(['whatsapp_provider_id', 'key']);
        });

        Schema::create('whatsapp_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('whatsapp_provider_id')->constrained('whatsapp_providers')->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('phone_number', 50)->nullable();
            $table->string('external_account_id', 200)->nullable();
            $table->string('status', 30)->default('active');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['whatsapp_provider_id', 'status']);
        });

        Schema::create('whatsapp_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name', 120)->nullable();
            $table->string('phone_number', 50)->index();
            $table->string('wa_id', 80)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['phone_number']);
        });

        Schema::create('whatsapp_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('whatsapp_provider_id')->nullable()->constrained('whatsapp_providers')->nullOnDelete();
            $table->foreignId('whatsapp_account_id')->nullable()->constrained('whatsapp_accounts')->nullOnDelete();
            $table->foreignId('whatsapp_contact_id')->nullable()->constrained('whatsapp_contacts')->nullOnDelete();
            $table->string('external_conversation_id', 200)->nullable();
            $table->string('status', 30)->default('open');
            $table->timestamp('last_message_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['whatsapp_provider_id', 'last_message_at'], 'wa_conversations_provider_last_message_idx');
        });

        Schema::create('whatsapp_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('whatsapp_provider_id')->nullable()->constrained('whatsapp_providers')->nullOnDelete();
            $table->foreignId('whatsapp_conversation_id')->nullable()->constrained('whatsapp_conversations')->nullOnDelete();
            $table->foreignId('whatsapp_contact_id')->nullable()->constrained('whatsapp_contacts')->nullOnDelete();
            $table->string('direction', 10)->default('outbound')->index();
            $table->string('type', 20)->default('text');
            $table->string('to', 50)->nullable();
            $table->string('from', 50)->nullable();
            $table->text('body')->nullable();
            $table->string('media_url', 1000)->nullable();
            $table->string('template_name', 120)->nullable();
            $table->string('provider_message_id', 200)->nullable()->index();
            $table->string('status', 20)->default('queued')->index();
            $table->string('idempotency_key', 100)->nullable()->unique();
            $table->text('error_message')->nullable();
            $table->json('payload')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['whatsapp_provider_id', 'created_at']);
        });

        Schema::create('whatsapp_message_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('whatsapp_provider_id')->constrained('whatsapp_providers')->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('language', 12)->default('id');
            $table->string('category', 30)->nullable();
            $table->string('status', 30)->default('approved');
            $table->json('components')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['whatsapp_provider_id', 'name', 'language'], 'wa_templates_provider_name_language_unique');
        });

        Schema::create('whatsapp_webhooks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('whatsapp_provider_id')->nullable()->constrained('whatsapp_providers')->nullOnDelete();
            $table->string('event', 60)->default('unknown');
            $table->string('provider_event', 120)->nullable();
            $table->string('provider_message_id', 200)->nullable();
            $table->string('status', 30)->default('processed');
            $table->text('error')->nullable();
            $table->json('payload')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['whatsapp_provider_id', 'created_at']);
        });

        Schema::create('whatsapp_delivery_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('whatsapp_message_id')->nullable()->constrained('whatsapp_messages')->nullOnDelete();
            $table->foreignId('whatsapp_provider_id')->nullable()->constrained('whatsapp_providers')->nullOnDelete();
            $table->string('status', 30);
            $table->string('provider_status', 60)->nullable();
            $table->text('description')->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();

            $table->index(['whatsapp_message_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_delivery_logs');
        Schema::dropIfExists('whatsapp_webhooks');
        Schema::dropIfExists('whatsapp_message_templates');
        Schema::dropIfExists('whatsapp_messages');
        Schema::dropIfExists('whatsapp_conversations');
        Schema::dropIfExists('whatsapp_contacts');
        Schema::dropIfExists('whatsapp_accounts');
        Schema::dropIfExists('whatsapp_provider_credentials');
        Schema::dropIfExists('whatsapp_providers');
    }
};
