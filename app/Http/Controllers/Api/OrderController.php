<?php

namespace App\Http\Controllers\Api;

use App\Actions\Orders\CreateOrderAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Models\Order;
use Illuminate\Http\JsonResponse;

class OrderController extends Controller
{
    /**
     * @OA\Get(
     *     path="/orders",
     *     tags={"Orders"},
     *     summary="Listar pedidos",
     *     description="Retorna lista paginada de pedidos com seus print jobs e impressoras",
     *     @OA\Parameter(
     *         name="page",
     *         in="query",
     *         description="Número da página",
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Lista de pedidos retornada com sucesso",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="id", type="integer", example=1),
     *                     @OA\Property(property="table_number", type="string", example="Mesa 5"),
     *                     @OA\Property(property="items", type="array", @OA\Items(type="object")),
     *                     @OA\Property(property="created_at", type="string", format="date-time"),
     *                     @OA\Property(property="updated_at", type="string", format="date-time"),
     *                     @OA\Property(property="print_jobs", type="array", @OA\Items(type="object"))
     *                 )
     *             ),
     *             @OA\Property(property="current_page", type="integer", example=1),
     *             @OA\Property(property="per_page", type="integer", example=20),
     *             @OA\Property(property="total", type="integer", example=100)
     *         )
     *     )
     * )
     */
    public function index(): JsonResponse
    {
        $orders = Order::query()
            ->with('printJobs.printer')
            ->latest()
            ->paginate(20);

        return response()->json($orders);
    }

    /**
     * @OA\Post(
     *     path="/orders",
     *     tags={"Orders"},
     *     summary="Criar pedido",
     *     description="Cria um novo pedido e automaticamente dispara print jobs para impressoras ativas",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"table_number", "items"},
     *             @OA\Property(property="table_number", type="string", example="Mesa 5", description="Número ou identificação da mesa"),
     *             @OA\Property(property="items", type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="name", type="string", example="Hambúrguer"),
     *                     @OA\Property(property="quantity", type="integer", example=2),
     *                     @OA\Property(property="price", type="number", format="float", example=25.90),
     *                     @OA\Property(property="notes", type="string", example="Sem cebola")
     *                 )
     *             ),
     *             example={
     *                 "table_number": "Mesa 5",
     *                 "items": {
     *                     {"name": "Hambúrguer", "quantity": 2, "price": 25.90, "notes": "Sem cebola"},
     *                     {"name": "Refrigerante", "quantity": 1, "price": 5.00}
     *                 }
     *             }
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Pedido criado com sucesso",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Pedido criado com sucesso."),
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="table_number", type="string", example="Mesa 5"),
     *                 @OA\Property(property="items", type="array", @OA\Items(type="object")),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Erro de validação"
     *     )
     * )
     */
    public function store(StoreOrderRequest $request, CreateOrderAction $action): JsonResponse
    {
        $order = $action->handle($request->validated());

        return response()->json([
            'message' => 'Pedido criado com sucesso.',
            'data' => $order,
        ], 201);
    }

    /**
     * @OA\Get(
     *     path="/orders/{order}",
     *     tags={"Orders"},
     *     summary="Visualizar pedido",
     *     description="Retorna detalhes de um pedido específico com seus print jobs e impressoras",
     *     @OA\Parameter(
     *         name="order",
     *         in="path",
     *         required=true,
     *         description="ID do pedido",
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Detalhes do pedido retornados com sucesso",
     *         @OA\JsonContent(
     *             @OA\Property(property="data", type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="table_number", type="string", example="Mesa 5"),
     *                 @OA\Property(property="items", type="array", @OA\Items(type="object")),
     *                 @OA\Property(property="created_at", type="string", format="date-time"),
     *                 @OA\Property(property="updated_at", type="string", format="date-time"),
     *                 @OA\Property(property="print_jobs", type="array",
     *                     @OA\Items(
     *                         @OA\Property(property="id", type="integer"),
     *                         @OA\Property(property="status", type="string"),
     *                         @OA\Property(property="printer", type="object")
     *                     )
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Pedido não encontrado"
     *     )
     * )
     */
    public function show(Order $order): JsonResponse
    {
        return response()->json([
            'data' => $order->load('printJobs.printer'),
        ]);
    }
}
