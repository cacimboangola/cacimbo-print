<?php

namespace App\Http\Controllers\Api;

use App\Actions\Orders\CreateOrderAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Models\Order;
use Illuminate\Http\JsonResponse;

class OrderController extends Controller
{
    public function index(): JsonResponse
    {
        $orders = Order::query()
            ->with('printJobs.printer')
            ->latest()
            ->paginate(20);

        return response()->json($orders);
    }

    public function store(StoreOrderRequest $request, CreateOrderAction $action): JsonResponse
    {
        $order = $action->handle($request->validated());

        return response()->json([
            'message' => 'Pedido criado com sucesso.',
            'data' => $order,
        ], 201);
    }

    public function show(Order $order): JsonResponse
    {
        return response()->json([
            'data' => $order->load('printJobs.printer'),
        ]);
    }
}
