<?php

use App\Models\Order;
use App\Models\Printer;

it('can list orders', function () {
    Order::factory()->count(3)->create();

    $this->getJson('/api/orders')
        ->assertSuccessful()
        ->assertJsonCount(3, 'data');
});

it('can create an order with print jobs', function () {
    $printer = Printer::factory()->kitchen()->create();

    $payload = [
        'table_number' => '5',
        'items' => [
            ['name' => 'Frango Grelhado', 'quantity' => 2, 'price' => 2500.00],
            ['name' => 'Cerveja', 'quantity' => 3, 'price' => 500.00],
        ],
        'total' => 6500.00,
        'notes' => 'Sem pimenta',
        'printer_ids' => [$printer->id],
    ];

    $this->postJson('/api/orders', $payload)
        ->assertCreated()
        ->assertJsonPath('data.table_number', '5')
        ->assertJsonPath('data.status', 'pending');

    $this->assertDatabaseHas('orders', [
        'table_number' => '5',
        'total' => 6500.00,
    ]);

    $this->assertDatabaseHas('print_jobs', [
        'printer_id' => $printer->id,
        'status' => 'pending',
    ]);
});

it('creates print jobs for all active printers when no printer_ids specified', function () {
    Printer::factory()->kitchen()->create();
    Printer::factory()->bar()->create();
    Printer::factory()->inactive()->create();

    $payload = [
        'table_number' => '10',
        'items' => [
            ['name' => 'Muamba de Galinha', 'quantity' => 1, 'price' => 3500.00],
        ],
        'total' => 3500.00,
    ];

    $this->postJson('/api/orders', $payload)
        ->assertCreated();

    expect(Order::first()->printJobs)->toHaveCount(2);
});

it('validates required fields when creating an order', function () {
    $this->postJson('/api/orders', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['table_number', 'items']);
});

it('validates items array structure', function () {
    $payload = [
        'table_number' => '1',
        'items' => [
            ['name' => 'Test'],
        ],
    ];

    $this->postJson('/api/orders', $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['items.0.quantity', 'items.0.price']);
});

it('can show a single order', function () {
    $order = Order::factory()->create();

    $this->getJson("/api/orders/{$order->id}")
        ->assertSuccessful()
        ->assertJsonPath('data.id', $order->id);
});

