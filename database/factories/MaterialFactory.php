<?php

namespace Database\Factories;

use App\Models\Module;
use Illuminate\Database\Eloquent\Factories\Factory;

class MaterialFactory extends Factory
{
    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'module_id' => Module::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->text(),
            'sort_order' => fake()->numberBetween(-10000, 10000),
            'status' => 'published',
        ];
    }
}
