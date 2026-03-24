<?php

namespace App\Http\Controllers\Api;

use App\Actions\PrintJobs\CreateDirectPrintJobAction;
use App\Actions\PrintJobs\GetPendingPrintJobsAction;
use App\Actions\PrintJobs\MarkPrintJobAsCompletedAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\CompletePrintJobRequest;
use App\Models\Printer;
use App\Models\PrintJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PrintJobController extends Controller
{
    /**
     * Cria um print job direto (HTML, PDF ou JSON) para uma impressora.
     * POST /api/print-jobs
     */
    public function store(Request $request, CreateDirectPrintJobAction $action): JsonResponse
    {
        $validated = $request->validate([
            'printer_id' => ['required', 'exists:printers,id'],
            'content' => ['required', 'array'],
            'content.type' => ['sometimes', 'string', 'in:html,pdf,order'],
            'content.content' => ['required_if:content.type,html,pdf', 'string'],
        ]);

        $printer = Printer::query()->findOrFail($validated['printer_id']);

        $printJob = $action->handle($printer, $validated['content']);

        return response()->json([
            'message' => 'Print job criado com sucesso.',
            'data' => $printJob,
        ], 201);
    }

    /**
     * Endpoint para o agente local fazer polling de jobs pendentes.
     * GET /api/print-jobs/pending?printer_identifier=xxx
     */
    public function pending(Request $request, GetPendingPrintJobsAction $action): JsonResponse
    {
        $request->validate([
            'printer_identifier' => ['required', 'string', 'exists:printers,identifier'],
        ]);

        $jobs = $action->handle($request->string('printer_identifier')->toString());

        $printer = Printer::query()->where('identifier', $request->string('printer_identifier')->toString())->first();

        if ($printer) {
            $printer->update(['last_seen_at' => now()]);
        }

        return response()->json([
            'data' => $jobs,
        ]);
    }

    /**
     * Endpoint para o agente local marcar um job como completo ou falho.
     * PATCH /api/print-jobs/{printJob}/complete
     */
    public function complete(CompletePrintJobRequest $request, PrintJob $printJob, MarkPrintJobAsCompletedAction $action): JsonResponse
    {
        if ($request->validated('status') === 'completed') {
            $printJob = $action->handle($printJob);
        } else {
            $printJob->update([
                'status' => 'failed',
                'attempts' => $printJob->attempts + 1,
            ]);
            $printJob->refresh();
        }

        return response()->json([
            'message' => 'Print job atualizado.',
            'data' => $printJob,
        ]);
    }
}
