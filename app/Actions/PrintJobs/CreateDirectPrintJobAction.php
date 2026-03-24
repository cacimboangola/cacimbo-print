<?php

namespace App\Actions\PrintJobs;

use App\Models\Printer;
use App\Models\PrintJob;

final readonly class CreateDirectPrintJobAction
{
    /**
     * @param array<string, mixed> $content
     */
    public function handle(Printer $printer, array $content): PrintJob
    {
        return PrintJob::query()->create([
            'printer_id' => $printer->id,
            'order_id' => null,
            'content' => $content,
            'status' => 'pending',
            'attempts' => 0,
        ]);
    }
}
