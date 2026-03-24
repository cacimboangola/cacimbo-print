<?php

namespace App\Models;

use Database\Factories\PrintJobFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrintJob extends Model
{
    /** @use HasFactory<PrintJobFactory> */
    use HasFactory;

    protected $fillable = [
        'printer_id',
        'order_id',
        'content',
        'status',
        'attempts',
        'printed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'content' => 'array',
            'printed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Printer, $this>
     */
    public function printer(): BelongsTo
    {
        return $this->belongsTo(Printer::class);
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
