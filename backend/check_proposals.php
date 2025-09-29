<?php

require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Verificando propuestas para la empresa ID 8 ===" . PHP_EOL;

// Buscar propuestas directamente relacionadas con facturas de la empresa 8
$proposals = App\Models\InvestmentProposal::with(['investor', 'invoice', 'respondedBy'])
    ->whereHas('invoice', function ($q) {
        $q->where('company_id', 8);
    })
    ->get();

echo "Total de propuestas encontradas: " . $proposals->count() . PHP_EOL;

if ($proposals->count() > 0) {
    foreach ($proposals as $proposal) {
        echo "- Propuesta ID: " . $proposal->id . PHP_EOL;
        echo "  Estado: " . $proposal->status . PHP_EOL;
        echo "  Monto: $" . number_format($proposal->amount, 2) . PHP_EOL;
        echo "  Factura ID: " . $proposal->invoice_id . PHP_EOL;
        echo "  Enviada: " . ($proposal->sent_at ? $proposal->sent_at : 'No enviada') . PHP_EOL;
        echo "  ---" . PHP_EOL;
    }
} else {
    echo "No se encontraron propuestas para la empresa ID 8" . PHP_EOL;
}

// Verificar también las facturas de la empresa
echo PHP_EOL . "=== Verificando facturas de la empresa ID 8 ===" . PHP_EOL;
$invoices = App\Models\Invoice::where('company_id', 8)->get();
echo "Total de facturas: " . $invoices->count() . PHP_EOL;

if ($invoices->count() > 0) {
    foreach ($invoices as $invoice) {
        echo "- Factura ID: " . $invoice->id . " - " . $invoice->invoice_number . PHP_EOL;
        echo "  Monto: $" . number_format($invoice->amount, 2) . PHP_EOL;
        echo "  Estado: " . $invoice->status . PHP_EOL;
        echo "  ---" . PHP_EOL;
    }
}