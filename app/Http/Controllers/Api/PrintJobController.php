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
     * @OA\Post(
     *     path="/print-jobs",
     *     tags={"Print Jobs"},
     *     summary="Criar print job direto",
     *     description="Cria um job de impressão direto (HTML, PDF ou Order) para uma impressora específica",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"printer_id", "content"},
     *             @OA\Property(property="printer_id", type="integer", example=1, description="ID da impressora de destino"),
     *             @OA\Property(property="content", type="object",
     *                 @OA\Property(property="type", type="string", enum={"html", "pdf", "order"}, example="pdf", description="Tipo de conteúdo"),
     *                 @OA\Property(property="content", type="string", example="JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL...", description="Conteúdo em base64 (para PDF) ou HTML string")
     *             ),
     *             example={
     *                 "printer_id": 1,
     *                 "content": {
     *                     "type": "pdf",
     *                     "content": "JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PC9UeXBlL..."
     *                 }
     *             }
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Print job criado com sucesso",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Print job criado com sucesso."),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="printer_id", type="integer", example=1),
     *                 @OA\Property(property="order_id", type="integer", nullable=true, example=null),
     *                 @OA\Property(property="content", type="object"),
     *                 @OA\Property(property="status", type="string", example="pending"),
     *                 @OA\Property(property="attempts", type="integer", example=0),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Erro de validação"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Impressora não encontrada"
     *     )
     * )
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
     * @OA\Get(
     *     path="/print-jobs/pending",
     *     tags={"Print Jobs"},
     *     summary="Obter jobs pendentes (Polling)",
     *     description="Endpoint para o print agent local fazer polling de jobs pendentes. Atualiza last_seen_at da impressora.",
     *     @OA\Parameter(
     *         name="printer_identifier",
     *         in="query",
     *         required=true,
     *         description="UUID da impressora",
     *         @OA\Schema(type="string", example="550e8400-e29b-41d4-a716-446655440000")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Lista de jobs pendentes retornada com sucesso",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="id", type="integer", example=1),
     *                     @OA\Property(property="printer_id", type="integer", example=1),
     *                     @OA\Property(property="order_id", type="integer", nullable=true, example=5),
     *                     @OA\Property(property="content", type="object", description="Conteúdo do job (Order, HTML ou PDF)"),
     *                     @OA\Property(property="status", type="string", example="pending"),
     *                     @OA\Property(property="attempts", type="integer", example=0),
     *                     @OA\Property(property="created_at", type="string", format="date-time"),
     *                     @OA\Property(property="updated_at", type="string", format="date-time")
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Erro de validação - printer_identifier inválido ou não existe"
     *     )
     * )
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
     * @OA\Patch(
     *     path="/print-jobs/{printJob}/complete",
     *     tags={"Print Jobs"},
     *     summary="Marcar job como completo ou falho",
     *     description="Endpoint para o print agent local marcar um job como completo (sucesso) ou failed (falha)",
     *     @OA\Parameter(
     *         name="printJob",
     *         in="path",
     *         required=true,
     *         description="ID do print job",
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"status"},
     *             @OA\Property(property="status", type="string", enum={"completed", "failed"}, example="completed", description="Status final do job")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Print job atualizado com sucesso",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Print job atualizado."),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="printer_id", type="integer", example=1),
     *                 @OA\Property(property="order_id", type="integer", nullable=true, example=5),
     *                 @OA\Property(property="content", type="object"),
     *                 @OA\Property(property="status", type="string", example="completed"),
     *                 @OA\Property(property="attempts", type="integer", example=1),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time"),
     *                 @OA\Property(property="completed_at", type="string", format="date-time", nullable=true)
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Print job não encontrado"
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Erro de validação"
     *     )
     * )
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
