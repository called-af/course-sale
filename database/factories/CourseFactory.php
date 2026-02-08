<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CourseFactory extends Factory
{
    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'creator_id' => User::factory(),
            'title' => fake()->sentence(4),
            'slug' => fake()->slug(),
            'description' => fake()->text(),
            'thumbnail' => fake()->word(),
            'type' => fake()->randomElement(["free","paid"]),
            'price' => fake()->randomFloat(2, 0, 99999999.99),
            'level' => fake()->randomElement(["beginner","intermediate","advanced"]),
            'status' => fake()->randomElement(["draft","review","published","archived"]),
            'published_at' => fake()->dateTime(),
            'rating_avg' => fake()->randomFloat(2, 0, 9.99),
            'rating_count' => fake()->numberBetween(-10000, 10000),
        ];
    }
}
