<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public const DEFAULT_PASSWORD = 'password';

    public function run(): void
    {
        $seedPassword = env('SEEDER_PASSWORD');

        if (app()->environment('production') && blank($seedPassword)) {
            $this->command?->warn('SEEDER_PASSWORD is not set. Skipping user seeding for production.');

            return;
        }

        $seedPassword = filled($seedPassword) ? (string) $seedPassword : self::DEFAULT_PASSWORD;

        $users = [
            ['name' => 'Admin', 'email' => 'admin@example.com', 'role' => 'admin'],
            ['name' => 'Budi Santoso', 'email' => 'budi@example.com', 'role' => 'instructor'],
            ['name' => 'Rina Wijaya', 'email' => 'rina@example.com', 'role' => 'instructor'],
            ['name' => 'Dika Pratama', 'email' => 'dika@example.com', 'role' => 'instructor'],
            ['name' => 'Student', 'email' => 'student@example.com', 'role' => 'student'],
        ];

        foreach ($users as $user) {
            User::query()->updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'password' => Hash::make($seedPassword),
                    'role' => $user['role'],
                    'avatar' => null,
                ],
            );
        }
    }
}
