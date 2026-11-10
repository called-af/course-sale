<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Payment providers/methods are configuration data and are safe (and
        // necessary) to seed in every environment.
        $this->call(PaymentSeeder::class);

        // Demo users/courses must never be created in production unless an
        // explicit seeder password is provided.
        if (app()->environment('production') && blank(env('SEEDER_PASSWORD'))) {
            $this->command?->warn('SEEDER_PASSWORD is not set. Skipping demo seed data for production.');

            return;
        }

        $this->call([
            UserSeeder::class,
            CategorySeeder::class,
            CourseSeeder::class,
            CourseApprovalSeeder::class,
            TagSeeder::class,
        ]);
    }
}
