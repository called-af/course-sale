<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admin can view the landing page while logged in', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('landing/page'));

    $this->actingAs($admin)
        ->get(route('admin.landing'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('landing/page'));
});

test('non-admin users are still redirected to their dashboard', function () {
    $student = User::factory()->create(['role' => 'student']);

    $this->actingAs($student)
        ->get(route('home'))
        ->assertRedirect(route('home.redirect'));
});
