<?php

use App\Models\Printer;

it('can list printers', function () {
    Printer::factory()->count(3)->create();

    $this->getJson('/api/printers')
        ->assertSuccessful()
        ->assertJsonCount(3, 'data');
});

it('can register a new printer', function () {
    $this->postJson('/api/printers/register', [
        'name' => 'Cozinha Principal',
        'type' => 'kitchen',
    ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Cozinha Principal')
        ->assertJsonPath('data.type', 'kitchen')
        ->assertJsonPath('data.is_active', true);

    $this->assertDatabaseHas('printers', [
        'name' => 'Cozinha Principal',
        'type' => 'kitchen',
    ]);

    expect(Printer::first()->identifier)->not->toBeEmpty();
});

it('validates required fields when registering a printer', function () {
    $this->postJson('/api/printers/register', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'type']);
});

it('validates printer type', function () {
    $this->postJson('/api/printers/register', [
        'name' => 'Test',
        'type' => 'invalid_type',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['type']);
});

it('can toggle a printer active status', function () {
    $printer = Printer::factory()->create(['is_active' => true]);

    $this->patchJson("/api/printers/{$printer->id}/toggle")
        ->assertSuccessful()
        ->assertJsonPath('data.is_active', false);

    expect($printer->fresh()->is_active)->toBeFalse();

    $this->patchJson("/api/printers/{$printer->id}/toggle")
        ->assertSuccessful()
        ->assertJsonPath('data.is_active', true);

    expect($printer->fresh()->is_active)->toBeTrue();
});
