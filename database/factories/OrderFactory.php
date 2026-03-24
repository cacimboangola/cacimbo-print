<?php

namespace Database\Factories;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $items = [];
        $total = 0;
        $count = fake()->numberBetween(1, 5);

        for ($i = 0; $i < $count; $i++) {
            $price = fake()->randomFloat(2, 500, 5000);
            $qty = fake()->numberBetween(1, 3);
            $total += $price * $qty;

            $items[] = [
                'name' => fake()->randomElement(['Frango Grelhado', 'Muamba de Galinha', 'Calulu de Peixe', 'Funge', 'Arroz', 'Cerveja', 'Sumo Natural', 'Bife com Batata']),
                'quantity' => $qty,
                'price' => $price,
                'notes' => fake()->optional(0.3)->sentence(),
            ];
        }

        return [
            'table_number' => (string) fake()->numberBetween(1, 30),
            'items' => $items,
            'total' => round($total, 2),
            'status' => 'pending',
            'notes' => fake()->optional(0.2)->sentence(),
        ];
    }
}
