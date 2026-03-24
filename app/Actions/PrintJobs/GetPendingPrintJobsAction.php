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
        return PrintJob::query()
            ->with('order')
            ->whereHas('printer', fn ($query) => $query->where('identifier', $printerIdentifier)->where('is_active', true))
            ->where('status', 'pending')
            ->oldest()
            ->get();
    }
}
