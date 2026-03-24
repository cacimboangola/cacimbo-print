<?php

namespace Database\Factories;

use App\Models\Printer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Printer>
 */
class PrinterFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true).' Printer',
            'identifier' => fake()->uuid(),
            'type' => fake()->randomElement(['kitchen', 'bar', 'receipt']),
            'is_active' => true,
            'last_seen_at' => null,
        ];
    }

    public function kitchen(): static
    {
        return $this->state(fn () => ['type' => 'kitchen']);
    }

    public function bar(): static
    {
        return $this->state(fn () => ['type' => 'bar']);
    }

    public function receipt(): static
    {
        return $this->state(fn () => ['type' => 'receipt']);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
