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

        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_content_id')->constrained()->cascadeOnDelete();
            $table->text('question');
            $table->enum('type', ['multiple_choice', 'essay'])->default('multiple_choice');
            $table->text('image')->nullable();
            $table->integer('sort_order');
            $table->timestamps();
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_questions');
    }
};
