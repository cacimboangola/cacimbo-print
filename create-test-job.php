<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$printer = App\Models\Printer::find(4);

if (!$printer) {
    echo "Impressora não encontrada\n";
    exit(1);
}

$job = App\Models\PrintJob::create([
    'printer_id' => 4,
    'content' => [
        'type' => 'html',
        'content' => '<html><body><h1>Teste PDF PRINTER</h1><p>Este job deve ir para \\ARNALDO\TESTE</p></body></html>'
    ],
    'status' => 'pending'
]);

echo "Job criado com sucesso: ID {$job->id}\n";
echo "Impressora: {$printer->name} ({$printer->identifier})\n";
