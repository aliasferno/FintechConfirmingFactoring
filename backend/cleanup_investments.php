<?php

use Illuminate\Foundation\Application;
use App\Models\Investment;
use App\Models\Invoice;
use App\Models\Payment;

// Crear la aplicación Laravel
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Eliminando pagos asociados a inversiones de la factura #18...\n";
$investments = Investment::where('invoice_id', 18)->get();
foreach ($investments as $investment) {
    Payment::where('investment_id', $investment->id)->delete();
}

echo "Eliminando inversiones de la factura #18...\n";
Investment::where('invoice_id', 18)->delete();

echo "Revirtiendo estado de la factura #18 a approved...\n";
$invoice = Invoice::find(18);
if ($invoice) {
    $invoice->update(['status' => 'approved']);
    echo "Factura actualizada exitosamente.\n";
} else {
    echo "Factura no encontrada.\n";
}

echo "Proceso completado.\n";