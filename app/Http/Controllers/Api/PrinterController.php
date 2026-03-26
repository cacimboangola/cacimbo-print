<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Printer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PrinterController extends Controller
{
    /**
     * @OA\Get(
     *     path="/printers",
     *     tags={"Printers"},
     *     summary="Listar todas as impressoras",
     *     description="Retorna lista de todas as impressoras cadastradas com contagem de jobs pendentes",
     *     @OA\Response(
     *         response=200,
     *         description="Lista de impressoras retornada com sucesso",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="id", type="integer", example=1),
     *                     @OA\Property(property="name", type="string", example="Cozinha Principal"),
     *                     @OA\Property(property="identifier", type="string", example="550e8400-e29b-41d4-a716-446655440000"),
     *                     @OA\Property(property="type", type="string", enum={"kitchen", "bar", "receipt"}, example="kitchen"),
     *                     @OA\Property(property="is_active", type="boolean", example=true),
     *                     @OA\Property(property="pending_print_jobs_count", type="integer", example=3),
     *                     @OA\Property(property="created_at", type="string", format="date-time"),
     *                     @OA\Property(property="updated_at", type="string", format="date-time")
     *                 )
     *             )
     *         )
     *     )
     * )
     */
    public function index(): JsonResponse
    {
        $printers = Printer::query()
            ->withCount('pendingPrintJobs')
            ->get();

        return response()->json([
            'data' => $printers,
        ]);
    }

    /**
     * @OA\Post(
     *     path="/printers/register",
     *     tags={"Printers"},
     *     summary="Registrar nova impressora",
     *     description="Cria uma nova impressora no sistema e gera um UUID único para identificação",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name", "type"},
     *             @OA\Property(property="name", type="string", example="Cozinha Principal", description="Nome descritivo da impressora"),
     *             @OA\Property(property="type", type="string", enum={"kitchen", "bar", "receipt"}, example="kitchen", description="Tipo da impressora")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Impressora registrada com sucesso",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Impressora registrada com sucesso."),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="name", type="string", example="Cozinha Principal"),
     *                 @OA\Property(property="identifier", type="string", example="550e8400-e29b-41d4-a716-446655440000"),
     *                 @OA\Property(property="type", type="string", example="kitchen"),
     *                 @OA\Property(property="is_active", type="boolean", example=true),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Erro de validação",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="The name field is required."),
     *             @OA\Property(property="errors", type="object")
     *         )
     *     )
     * )
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:kitchen,bar,receipt'],
        ]);

        $printer = Printer::query()->create([
            'name' => $validated['name'],
            'identifier' => Str::uuid()->toString(),
            'type' => $validated['type'],
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Impressora registrada com sucesso.',
            'data' => $printer,
        ], 201);
    }

    /**
     * @OA\Patch(
     *     path="/printers/{printer}/toggle",
     *     tags={"Printers"},
     *     summary="Ativar/desativar impressora",
     *     description="Alterna o status de ativação da impressora (ativa/inativa)",
     *     @OA\Parameter(
     *         name="printer",
     *         in="path",
     *         required=true,
     *         description="ID da impressora",
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Status da impressora alterado com sucesso",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Impressora ativada."),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="name", type="string", example="Cozinha Principal"),
     *                 @OA\Property(property="identifier", type="string", example="550e8400-e29b-41d4-a716-446655440000"),
     *                 @OA\Property(property="type", type="string", example="kitchen"),
     *                 @OA\Property(property="is_active", type="boolean", example=true),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Impressora não encontrada"
     *     )
     * )
     */
    public function toggle(Printer $printer): JsonResponse
    {
        $printer->update(['is_active' => ! $printer->is_active]);

        return response()->json([
            'message' => $printer->is_active ? 'Impressora ativada.' : 'Impressora desativada.',
            'data' => $printer,
        ]);
    }
}
