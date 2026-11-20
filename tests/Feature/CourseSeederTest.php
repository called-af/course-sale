<?php

use App\Models\Course;
use App\Models\Material;
use App\Models\MaterialContent;
use Database\Seeders\CategorySeeder;
use Database\Seeders\CourseSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('seeds every material with multiple published content blocks of different types', function () {
    $this->seed([UserSeeder::class, CategorySeeder::class, CourseSeeder::class]);

    $courses = Course::query()->count();
    $materials = Material::query()->with('contents')->get();

    expect($courses)->toBe(10)
        ->and($materials)->not->toBeEmpty();

    foreach ($materials as $material) {
        $contents = $material->contents;
        $types = $contents->pluck('type')->unique();

        expect($contents->count())->toBeGreaterThanOrEqual(4)
            ->and($types->count())->toBeGreaterThanOrEqual(4)
            ->and($contents->every(fn (MaterialContent $content) => $content->material_id === $material->id))->toBeTrue()
            ->and($contents->every(fn (MaterialContent $content) => $content->status === 'published'))->toBeTrue();
    }
});

it('keeps quiz questions attached to quiz content blocks', function () {
    $this->seed([UserSeeder::class, CategorySeeder::class, CourseSeeder::class]);

    $quizContents = MaterialContent::query()
        ->where('type', 'quiz')
        ->withCount('quizQuestions')
        ->get();

    expect($quizContents)->not->toBeEmpty();

    foreach ($quizContents as $quizContent) {
        expect($quizContent->quiz_questions_count)->toBeGreaterThan(0);

        foreach ($quizContent->quizQuestions()->withCount('quizOptions')->get() as $question) {
            if ($question->type === 'multiple_choice') {
                expect($question->quiz_options_count)->toBeGreaterThan(0);
            }
        }
    }
});
