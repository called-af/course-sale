<?php

use App\Models\Order;
use App\Models\Payment;

it('expires pending orders whose payment window has passed', function () {
    $order = Order::factory()->create([
        'order_number' => 'ORD-EXPIRE-1',
        'status' => 'pending',
        'expires_at' => now()->subMinutes(5),
    ]);

    $payment = Payment::factory()->create([
        'order_id' => $order->id,
        'status' => 'pending',
    ]);

    $futureOrder = Order::factory()->create([
        'order_number' => 'ORD-EXPIRE-2',
        'status' => 'pending',
        'expires_at' => now()->addHour(),
    ]);

    $this->artisan('orders:expire')->assertSuccessful();

    expect($order->fresh()->status)->toBe('expired')
        ->and($payment->fresh()->status)->toBe('expired')
        ->and($futureOrder->fresh()->status)->toBe('pending');
});

it('never expires orders that are already paid', function () {
    $order = Order::factory()->create([
        'order_number' => 'ORD-EXPIRE-3',
        'status' => 'paid',
        'expires_at' => now()->subHours(2),
    ]);

    $this->artisan('orders:expire')->assertSuccessful();

    expect($order->fresh()->status)->toBe('paid');
});

it('keeps orders without an expiry untouched', function () {
    $order = Order::factory()->create([
        'order_number' => 'ORD-EXPIRE-4',
        'status' => 'pending',
        'expires_at' => null,
    ]);

    $this->artisan('orders:expire')->assertSuccessful();

    expect($order->fresh()->status)->toBe('pending');
});
