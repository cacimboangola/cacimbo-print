<?php

namespace App\Actions\Orders;

use App\Actions\PrintJobs\CreatePrintJobAction;
use App\Models\Order;
use App\Models\Printer;

final readonly class CreateOrderAction
{
    public function __construct(private CreatePrintJobAction $createPrintJobAction) {}

    /**
     * @param array<string, mixed> $data
     */
    public function handle(array $data): Order
    {
        $order = Order::query()->create([
            'table_number' => $data['table_number'],
            'items' => $data['items'],
            'total' => $data['total'] ?? 0,
            'status' => 'pending',
            'notes' => $data['notes'] ?? null,
        ]);

        $this->dispatchPrintJobs($order, $data);

        return $order->load('printJobs');
    }

    /**
     * @param array<string, mixed> $data
     */
    private function dispatchPrintJobs(Order $order, array $data): void
    {
        $printerIds = $data['printer_ids'] ?? [];

        if (empty($printerIds)) {
            $printerIds = Printer::query()
                ->where('is_active', true)
                ->pluck('id')
                ->toArray();
        }

        $content = [
            'table_number' => $order->table_number,
            'items' => $order->items,
            'total' => $order->total,
            'notes' => $order->notes,
            'order_id' => $order->id,
            'created_at' => $order->created_at->toDateTimeString(),
        ];

        foreach ($printerIds as $printerId) {
            $printer = Printer::query()->find($printerId);

            if ($printer instanceof Printer) {
                $this->createPrintJobAction->handle($order, $printer, $content);
            }
        }
    }
}
