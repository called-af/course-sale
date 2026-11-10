<?php

namespace Database\Factories;

use App\Models\MaterialContent;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class QuizAttemptFactory extends Factory
{
    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'material_content_id' => MaterialContent::factory(),
            'started_at' => fake()->dateTime(),
            'finished_at' => fake()->dateTime(),
            'time_spent' => fake()->numberBetween(-10000, 10000),
            'score' => fake()->randomFloat(2, 0, 999.99),
            'status' => fake()->randomElement(['in_progress', 'completed', 'expired']),
        ];
    }
}
