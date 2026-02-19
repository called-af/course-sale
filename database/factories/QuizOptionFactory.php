<?php

namespace Database\Factories;

use App\Models\QuizQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuizOptionFactory extends Factory
{
    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'quiz_question_id' => QuizQuestion::factory(),
            'option_text' => fake()->word(),
            'is_correct' => fake()->boolean(),
        ];
    }
}
