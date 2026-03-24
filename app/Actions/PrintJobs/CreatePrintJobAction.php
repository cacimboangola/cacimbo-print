<?php

namespace App\Actions\PrintJobs;

use App\Models\Order;
use App\Models\Printer;
use App\Models\PrintJob;

final readonly class CreatePrintJobAction
{
    /**
     * @param array<string, mixed> $content
     */
    public function handle(Order $order, Printer $printer, array $content): PrintJob
    {
        return PrintJob::query()->create([
            'order_id' => $order->id,
            'printer_id' => $printer->id,
            'content' => $content,
            'status' => 'pending',
            'attempts' => 0,
        ]);
    }
}
