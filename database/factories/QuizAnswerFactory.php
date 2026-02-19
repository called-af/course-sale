<?php

namespace Database\Factories;

use App\Models\QuizAttempt;
use App\Models\QuizOption;
use App\Models\QuizQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuizAnswerFactory extends Factory
{
    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'quiz_attempt_id' => QuizAttempt::factory(),
            'quiz_question_id' => QuizQuestion::factory(),
            'quiz_option_id' => QuizOption::factory(),
            'answer_text' => fake()->text(),
            'is_correct' => fake()->boolean(),
        ];
    }
}
