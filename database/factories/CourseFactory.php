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
            'instructor_id' => User::factory(),
            'title' => fake()->sentence(4),
            'slug' => fake()->slug(),
            'description' => fake()->text(),
            'thumbnail' => fake()->word(),
            'type' => fake()->randomElement(["free","paid"]),
            'price' => fake()->randomFloat(2, 0, 99999999.99),
            'level' => fake()->randomElement(["beginner","intermediate","advanced"]),
            'status' => fake()->randomElement(["draft","published"]),
        ];
    }
}
