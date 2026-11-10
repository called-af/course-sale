<?php

use App\Models\Order;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('shows orders with revenue and status statistics', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $student = User::factory()->create(['role' => 'student']);

    Order::factory()->create([
        'user_id' => $student->id,
        'order_number' => 'ORD-PAID-1',
        'status' => 'paid',
        'total_price' => 100000,
    ]);

    Order::factory()->create([
        'user_id' => $student->id,
        'order_number' => 'ORD-PENDING-1',
        'status' => 'pending',
        'total_price' => 50000,
    ]);

    $this->actingAs($admin)
        ->get('/admin/orders')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/orders/page')
            ->has('orders.data', 2)
            ->where('stats.revenue', 100000)
            ->where('stats.total_orders', 2)
            ->where('stats.paid.count', 1)
            ->where('stats.pending.count', 1)
            ->where('stats.pending.amount', 50000));
});

it('filters orders by status', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $student = User::factory()->create(['role' => 'student']);

    Order::factory()->create([
        'user_id' => $student->id,
        'order_number' => 'ORD-PAID-2',
        'status' => 'paid',
        'total_price' => 100000,
    ]);

    Order::factory()->create([
        'user_id' => $student->id,
        'order_number' => 'ORD-PENDING-2',
        'status' => 'pending',
        'total_price' => 50000,
    ]);

    $this->actingAs($admin)
        ->get('/admin/orders?status=paid')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.order_number', 'ORD-PAID-2')
            ->where('filters.status', 'paid'));
});

it('searches orders by student name', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $budi = User::factory()->create(['role' => 'student', 'name' => 'Budi Santoso']);
    $siti = User::factory()->create(['role' => 'student', 'name' => 'Siti Aminah']);

    Order::factory()->create([
        'user_id' => $budi->id,
        'order_number' => 'ORD-BUDI-1',
        'status' => 'pending',
    ]);

    Order::factory()->create([
        'user_id' => $siti->id,
        'order_number' => 'ORD-SITI-1',
        'status' => 'pending',
    ]);

    $this->actingAs($admin)
        ->get('/admin/orders?search=Budi')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.order_number', 'ORD-BUDI-1'));
});
