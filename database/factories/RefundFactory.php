<?php

namespace Database\Factories;

use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;

class RefundFactory extends Factory
{
    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'payment_id' => Payment::factory(),
            'amount' => fake()->randomFloat(2, 0, 99999999.99),
            'reason' => fake()->text(),
            'status' => fake()->randomElement(['pending', 'success', 'failed']),
            'refunded_at' => fake()->dateTime(),
        ];
    }
}
