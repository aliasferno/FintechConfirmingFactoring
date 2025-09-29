<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Investment;
use App\Models\Invoice;
use App\Models\Payment;

class CleanupInvestments extends Command
{
    protected $signature = 'cleanup:investments {invoice_id}';
    protected $description = 'Elimina todas las inversiones y pagos de una factura específica y revierte su estado';

    public function handle()
    {
        $invoiceId = $this->argument('invoice_id');
        
        $this->info("Eliminando pagos asociados a inversiones de la factura #{$invoiceId}...");
        
        $investments = Investment::where('invoice_id', $invoiceId)->get();
        $paymentsDeleted = 0;
        
        foreach ($investments as $investment) {
            $deleted = Payment::where('investment_id', $investment->id)->delete();
            $paymentsDeleted += $deleted;
        }
        
        $this->info("Pagos eliminados: {$paymentsDeleted}");
        
        $this->info("Eliminando inversiones de la factura #{$invoiceId}...");
        $investmentsDeleted = Investment::where('invoice_id', $invoiceId)->delete();
        $this->info("Inversiones eliminadas: {$investmentsDeleted}");
        
        $this->info("Revirtiendo estado de la factura #{$invoiceId} a 'approved'...");
        $invoice = Invoice::find($invoiceId);
        
        if ($invoice) {
            $invoice->update(['status' => 'approved']);
            $this->info("Factura actualizada exitosamente. Estado: {$invoice->status}");
        } else {
            $this->error("Factura no encontrada.");
            return 1;
        }
        
        $this->info("Proceso completado exitosamente.");
        return 0;
    }
}