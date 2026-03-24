<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Printer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PrinterController extends Controller
{
    public function index(): JsonResponse
    {
        $printers = Printer::query()
            ->withCount('pendingPrintJobs')
            ->get();

        return response()->json([
            'data' => $printers,
        ]);
    }

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

    public function toggle(Printer $printer): JsonResponse
    {
        $printer->update(['is_active' => ! $printer->is_active]);

        return response()->json([
            'message' => $printer->is_active ? 'Impressora ativada.' : 'Impressora desativada.',
            'data' => $printer,
        ]);
    }
}
