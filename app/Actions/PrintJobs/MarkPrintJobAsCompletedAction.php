<?php

namespace App\Actions\PrintJobs;

use App\Models\PrintJob;

final readonly class MarkPrintJobAsCompletedAction
{
    public function handle(PrintJob $printJob): PrintJob
    {
        $printJob->update([
            'status' => 'completed',
            'printed_at' => now(),
            'attempts' => $printJob->attempts + 1,
        ]);

        return $printJob->refresh();
    }
}
