<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderItemFactory extends Factory
{
    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'course_id' => Course::factory(),
            'course_title' => fake()->word(),
            'course_price' => fake()->randomFloat(2, 0, 99999999.99),
        ];
    }
}
