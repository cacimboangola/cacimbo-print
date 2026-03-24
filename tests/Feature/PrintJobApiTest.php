<?php

use App\Models\Order;
use App\Models\Printer;
use App\Models\PrintJob;

it('can fetch pending print jobs for a printer', function () {
    $printer = Printer::factory()->kitchen()->create();
    $order = Order::factory()->create();

    PrintJob::factory()->count(3)->create([
        'printer_id' => $printer->id,
        'order_id' => $order->id,
        'status' => 'pending',
    ]);

    PrintJob::factory()->completed()->create([
        'printer_id' => $printer->id,
        'order_id' => $order->id,
    ]);

    $this->getJson('/api/print-jobs/pending?printer_identifier=' . $printer->identifier)
        ->assertSuccessful()
        ->assertJsonCount(3, 'data');
});

it('does not return jobs for inactive printers', function () {
    $printer = Printer::factory()->inactive()->create();
    $order = Order::factory()->create();

    PrintJob::factory()->create([
        'printer_id' => $printer->id,
        'order_id' => $order->id,
        'status' => 'pending',
    ]);

    $this->getJson('/api/print-jobs/pending?printer_identifier=' . $printer->identifier)
        ->assertSuccessful()
        ->assertJsonCount(0, 'data');
});

it('updates last_seen_at when polling', function () {
    $printer = Printer::factory()->create(['last_seen_at' => null]);

    $this->getJson('/api/print-jobs/pending?printer_identifier=' . $printer->identifier)
        ->assertSuccessful();

    expect($printer->fresh()->last_seen_at)->not->toBeNull();
});

it('can mark a print job as completed', function () {
    $printJob = PrintJob::factory()->create(['status' => 'pending']);

    $this->patchJson("/api/print-jobs/{$printJob->id}/complete", [
        'status' => 'completed',
    ])
        ->assertSuccessful()
        ->assertJsonPath('data.status', 'completed');

    expect($printJob->fresh())
        ->status->toBe('completed')
        ->printed_at->not->toBeNull();
});

it('can mark a print job as failed', function () {
    $printJob = PrintJob::factory()->create(['status' => 'pending', 'attempts' => 0]);

    $this->patchJson("/api/print-jobs/{$printJob->id}/complete", [
        'status' => 'failed',
    ])
        ->assertSuccessful()
        ->assertJsonPath('data.status', 'failed');

    expect($printJob->fresh())
        ->status->toBe('failed')
        ->attempts->toBe(1);
});

it('validates status when completing a print job', function () {
    $printJob = PrintJob::factory()->create();

    $this->patchJson("/api/print-jobs/{$printJob->id}/complete", [
        'status' => 'invalid',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

it('requires printer_identifier when fetching pending jobs', function () {
    $this->getJson('/api/print-jobs/pending')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['printer_identifier']);
});
