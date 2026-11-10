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

        Schema::create('material_contents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['video', 'text', 'quiz', 'file', 'ppt']);
            $table->string('title');
            $table->text('content_url')->nullable();
            $table->string('preview_url')->nullable();
            $table->json('content_text')->nullable();
            $table->integer('duration')->nullable();
            $table->enum('status', ['draft', 'published'])->default('draft');
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
        Schema::dropIfExists('material_contents');
    }
};
