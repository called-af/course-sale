<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\PaymentProvider;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'provider_id' => PaymentProvider::factory(),
            'reference' => fake()->word(),
            'amount' => fake()->randomFloat(2, 0, 99999999.99),
            'currency' => fake()->word(),
            'status' => fake()->randomElement(["pending","paid","failed","expired","refunded"]),
            'payment_url' => fake()->text(),
            'paid_at' => fake()->dateTime(),
        ];
    }
}
