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

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained();
            $table->foreignId('provider_id')->constrained('payment_providers');
            $table->string('reference');
            // Raw transaction metadata from Midtrans, kept for reconciliation,
            // refund channel selection and chargeback auditing.
            $table->string('transaction_id')->nullable();
            $table->string('payment_type', 50)->nullable();
            $table->string('fraud_status', 30)->nullable();
            $table->string('status_code', 10)->nullable();
            $table->string('midtrans_status', 40)->nullable();
            $table->decimal('amount', 10, 2);
            $table->string('currency')->default('IDR');
            $table->enum('status', ['pending', 'paid', 'failed', 'expired', 'refunded', 'partial_refund', 'chargeback'])->default('pending');
            $table->text('payment_url')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('settlement_time')->nullable();
            $table->timestamp('expiry_time')->nullable();
            $table->decimal('refunded_amount', 12, 2)->default(0);
            $table->decimal('chargeback_amount', 12, 2)->default(0);
            $table->json('raw_response')->nullable();
            $table->timestamps();
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
