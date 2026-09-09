<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->boolean('is_approved')->default(true)->after('comment');
            $table->timestamp('approved_at')->nullable()->after('is_approved');
            $table->unique(['user_id', 'course_id']);
        });
    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'course_id']);
            $table->dropColumn(['is_approved', 'approved_at']);
        });
    }
};
