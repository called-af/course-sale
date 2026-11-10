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

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->string('order_number')->unique();
            $table->string('currency')->default('IDR');
            $table->foreignId('payment_method_id')->nullable();
            $table->decimal('total_price', 10, 2);
            $table->decimal('refunded_amount', 12, 2)->default(0);
            $table->decimal('chargeback_amount', 12, 2)->default(0);
            $table->enum('status', ['pending', 'paid', 'failed', 'expired', 'refunded', 'chargeback'])->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
