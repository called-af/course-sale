<?php

namespace Database\Factories;

use App\Models\Material;
use Illuminate\Database\Eloquent\Factories\Factory;

class MaterialContentFactory extends Factory
{
    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'material_id' => Material::factory(),
            'type' => fake()->randomElement(["video","text","quiz","file","ppt"]),
            'title' => fake()->sentence(4),
            'content_url' => fake()->text(),
            'content_text' => fake()->text(),
            'duration' => fake()->numberBetween(-10000, 10000),
            'sort_order' => fake()->numberBetween(-10000, 10000),
        ];
    }
}
