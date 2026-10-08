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
        $type = fake()->randomElement(['free', 'paid']);

        return [
            'creator_id' => User::factory(),
            'title' => fake()->sentence(4),
            'slug' => fake()->slug(),
            'description' => fake()->text(),
            'thumbnail' => fake()->word(),
            'type' => $type,
            'price' => $type === 'paid' ? fake()->randomFloat(2, 1000, 99999999.99) : null,
            'level' => fake()->randomElement(["beginner","intermediate","advanced"]),
            'status' => fake()->randomElement(["draft","review","published","archived"]),
            'published_at' => fake()->dateTime(),
            'rating_avg' => 0,
            'rating_count' => 0,
        ];
    }
}
