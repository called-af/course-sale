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
        Schema::table('modules', function (Blueprint $table) {
            $table->dropForeign('modules_course_id_foreign');
            $table->foreign('course_id')
                ->references('id')
                ->on('courses')
                ->cascadeOnDelete();
        });

        Schema::table('course_categories', function (Blueprint $table) {
            $table->dropForeign('course_categories_course_id_foreign');
            $table->foreign('course_id')
                ->references('id')
                ->on('courses')
                ->cascadeOnDelete();
        });

        Schema::table('material_contents', function (Blueprint $table) {
            $table->dropForeign('material_contents_material_id_foreign');
            $table->foreign('material_id')
                ->references('id')
                ->on('materials')
                ->cascadeOnDelete();
        });

        Schema::table('material_progress', function (Blueprint $table) {
            $table->dropForeign('material_progress_material_id_foreign');
            $table->foreign('material_id')
                ->references('id')
                ->on('materials')
                ->cascadeOnDelete();
        });

        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->dropForeign('quiz_questions_material_content_id_foreign');
            $table->foreign('material_content_id')
                ->references('id')
                ->on('material_contents')
                ->cascadeOnDelete();
        });

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->dropForeign('quiz_attempts_material_content_id_foreign');
            $table->foreign('material_content_id')
                ->references('id')
                ->on('material_contents')
                ->cascadeOnDelete();
        });

        Schema::table('quiz_answers', function (Blueprint $table) {
            $table->dropForeign('quiz_answers_quiz_question_id_foreign');
            $table->foreign('quiz_question_id')
                ->references('id')
                ->on('quiz_questions')
                ->cascadeOnDelete();

            $table->dropForeign('quiz_answers_quiz_attempt_id_foreign');
            $table->foreign('quiz_attempt_id')
                ->references('id')
                ->on('quiz_attempts')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quiz_answers', function (Blueprint $table) {
            $table->dropForeign(['quiz_question_id']);
            $table->foreign('quiz_question_id')
                ->references('id')
                ->on('quiz_questions');

            $table->dropForeign(['quiz_attempt_id']);
            $table->foreign('quiz_attempt_id')
                ->references('id')
                ->on('quiz_attempts');
        });

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->dropForeign(['material_content_id']);
            $table->foreign('material_content_id')
                ->references('id')
                ->on('material_contents');
        });

        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->dropForeign(['material_content_id']);
            $table->foreign('material_content_id')
                ->references('id')
                ->on('material_contents');
        });

        Schema::table('material_progress', function (Blueprint $table) {
            $table->dropForeign(['material_id']);
            $table->foreign('material_id')
                ->references('id')
                ->on('materials');
        });

        Schema::table('material_contents', function (Blueprint $table) {
            $table->dropForeign(['material_id']);
            $table->foreign('material_id')
                ->references('id')
                ->on('materials');
        });

        Schema::table('course_categories', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->foreign('course_id')
                ->references('id')
                ->on('courses');
        });

        Schema::table('modules', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->foreign('course_id')
                ->references('id')
                ->on('courses');
        });
    }
};
