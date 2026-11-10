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
        Schema::disableForeignKeyConstraints();

        Schema::create('refunds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained();
            // A deterministic refund_key makes retries idempotent. Midtrans
            // requires the same key when the same refund is retried.
            $table->string('refund_key', 80)->nullable()->unique();
            $table->string('provider_refund_id')->nullable();
            $table->decimal('amount', 10, 2);
            $table->text('reason')->nullable();
            $table->enum('status', ['pending', 'success', 'failed']);
            $table->string('provider_status', 40)->nullable();
            $table->string('type', 20)->default('manual');
            $table->timestamp('refunded_at')->nullable();
            $table->timestamp('bank_confirmed_at')->nullable();
            $table->json('raw')->nullable();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('refunds');
    }
};
