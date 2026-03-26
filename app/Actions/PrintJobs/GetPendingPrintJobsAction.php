<?php

namespace App\Actions\PrintJobs;

use App\Models\PrintJob;
use Illuminate\Database\Eloquent\Collection;

final readonly class GetPendingPrintJobsAction
{
    /**
     * @return Collection<int, PrintJob>
     */
    public function handle(string $printerIdentifier): Collection
    {
        $jobs = PrintJob::query()
            ->with(['order', 'printer:id,identifier'])
            ->whereHas('printer', fn ($query) => $query->where('identifier', $printerIdentifier)->where('is_active', true))
            ->where('status', 'pending')
            ->oldest()
            ->get();

        // Adicionar printer_identifier a cada job
        $jobs->each(function (PrintJob $job) {
            $job->printer_identifier = $job->printer->identifier;
        });

        return $jobs;
    }
}
