<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'avatar' => null,
        ]);

        User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'password' => Hash::make('password'),
            'role' => 'instructor',
            'avatar' => null,
        ]);

        User::create([
            'name' => 'Rina Wijaya',
            'email' => 'rina@example.com',
            'password' => Hash::make('password'),
            'role' => 'instructor',
            'avatar' => null,
        ]);

        User::create([
            'name' => 'Dika Pratama',
            'email' => 'dika@example.com',
            'password' => Hash::make('password'),
            'role' => 'instructor',
            'avatar' => null,
        ]);

        User::create([
            'name' => 'Student',
            'email' => 'student@example.com',
            'password' => Hash::make('password'),
            'role' => 'student',
            'avatar' => null,
        ]);
    }
}
