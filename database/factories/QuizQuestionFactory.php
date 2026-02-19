<?php

namespace Database\Factories;

use App\Models\MaterialContent;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuizQuestionFactory extends Factory
{
    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'material_content_id' => MaterialContent::factory(),
            'question' => fake()->text(),
            'sort_order' => fake()->numberBetween(-10000, 10000),
        ];
    }
}
