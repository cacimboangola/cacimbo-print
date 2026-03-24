<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Printer;
use App\Models\PrintJob;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PrintJob>
 */
class PrintJobFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'printer_id' => Printer::factory(),
            'order_id' => Order::factory(),
            'content' => [
                'table_number' => (string) fake()->numberBetween(1, 30),
                'items' => [
                    ['name' => 'Frango Grelhado', 'quantity' => 2, 'price' => 2500.00],
                ],
                'total' => 5000.00,
                'notes' => null,
                'order_id' => 1,
                'created_at' => now()->toDateTimeString(),
            ],
            'status' => 'pending',
            'attempts' => 0,
            'printed_at' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'status' => 'completed',
            'printed_at' => now(),
            'attempts' => 1,
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn () => [
            'status' => 'failed',
            'attempts' => 1,
        ]);
    }
}
