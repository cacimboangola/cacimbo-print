<?php

use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PrinterController;
use App\Http\Controllers\Api\PrintJobController;
use Illuminate\Support\Facades\Route;

Route::get('/orders', [OrderController::class, 'index']);
Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders/{order}', [OrderController::class, 'show']);

Route::get('/printers', [PrinterController::class, 'index']);
Route::post('/printers/register', [PrinterController::class, 'register']);
Route::patch('/printers/{printer}/toggle', [PrinterController::class, 'toggle']);

Route::post('/print-jobs', [PrintJobController::class, 'store']);
Route::get('/print-jobs/pending', [PrintJobController::class, 'pending']);
Route::patch('/print-jobs/{printJob}/complete', [PrintJobController::class, 'complete']);
