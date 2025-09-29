<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Investment;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PaymentService
{
    /**
     * Create payments for a confirming investment with advance request.
     * 
     * @param Investment $investment
     * @return array
     */
    public function createConfirmingPayments(Investment $investment): array
    {
        $invoice = $investment->invoice;
        $investor = $investment->user;
        
        // Validar que es una operación de confirming con solicitud de adelanto
        if ($invoice->operation_type !== 'confirming' || !$invoice->advance_request) {
            throw new \InvalidArgumentException('Esta operación solo es válida para confirming con solicitud de adelanto');
        }

        DB::beginTransaction();
        
        try {
            $payments = [];
            
            // 1. Crear pago inmediato al proveedor
            $supplierPayment = $this->createSupplierPayment($investment, $invoice, $investor);
            $payments[] = $supplierPayment;
            
            // 2. Crear cobro programado a la empresa
            $companyCharge = $this->createCompanyCharge($investment, $invoice, $investor);
            $payments[] = $companyCharge;
            
            DB::commit();
            
            Log::info('Pagos de confirming creados exitosamente', [
                'investment_id' => $investment->id,
                'supplier_payment_id' => $supplierPayment->id,
                'company_charge_id' => $companyCharge->id
            ]);
            
            return $payments;
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al crear pagos de confirming', [
                'investment_id' => $investment->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Create immediate payment to supplier.
     * 
     * @param Investment $investment
     * @param Invoice $invoice
     * @param User $investor
     * @return Payment
     */
    private function createSupplierPayment(Investment $investment, Invoice $invoice, User $investor): Payment
    {
        // Calcular monto: factura - descuento por pago anticipado
        $discountPercentage = $invoice->early_payment_discount ?? 0;
        $paymentAmount = $this->calculateSupplierPaymentAmount($invoice->amount, $discountPercentage);
        
        // Para confirming, el proveedor no es un usuario del sistema
        // Se registra el pago con información del proveedor de la factura
        $supplierName = $invoice->supplier_name ?? 'Proveedor no especificado';
        
        return Payment::create([
            'investment_id' => $investment->id,
            'invoice_id' => $invoice->id,
            'payer_id' => $investor->id,
            'payee_id' => null, // No hay usuario proveedor en el sistema
            'type' => Payment::TYPE_PAYMENT_TO_SUPPLIER,
            'amount' => $paymentAmount,
            'original_invoice_amount' => $invoice->amount,
            'discount_percentage' => $discountPercentage,
            'commission_percentage' => null,
            'scheduled_date' => now(), // Pago inmediato
            'executed_date' => null,
            'original_due_date' => $invoice->due_date,
            'status' => Payment::STATUS_PENDING,
            'description' => "Pago inmediato al proveedor {$supplierName} por factura {$invoice->invoice_number} con descuento por pago anticipado del {$discountPercentage}%",
            'metadata' => [
                'operation_type' => 'confirming',
                'advance_request' => true,
                'original_amount' => $invoice->amount,
                'discount_applied' => $invoice->amount - $paymentAmount,
                'supplier_name' => $supplierName,
                'supplier_tax_id' => $invoice->supplier_tax_id ?? null
            ]
        ]);
    }

    /**
     * Create scheduled charge to company.
     * 
     * @param Investment $investment
     * @param Invoice $invoice
     * @param User $investor
     * @return Payment
     */
    private function createCompanyCharge(Investment $investment, Invoice $invoice, User $investor): Payment
    {
        // Calcular monto: factura + comisión de confirming
        $commissionPercentage = $invoice->confirming_commission ?? 0;
        $chargeAmount = $this->calculateCompanyChargeAmount($invoice->amount, $commissionPercentage);
        
        // Obtener la empresa dueña de la factura
        $company = $invoice->company;
        $companyUser = $company->user; // Asumiendo que Company tiene relación con User
        
        if (!$companyUser) {
            throw new \Exception('No se encontró el usuario asociado a la empresa de la factura');
        }
        
        return Payment::create([
            'investment_id' => $investment->id,
            'invoice_id' => $invoice->id,
            'payer_id' => $companyUser->id,
            'payee_id' => $investor->id,
            'type' => Payment::TYPE_CHARGE_TO_COMPANY,
            'amount' => $chargeAmount,
            'original_invoice_amount' => $invoice->amount,
            'discount_percentage' => null,
            'commission_percentage' => $commissionPercentage,
            'scheduled_date' => Carbon::parse($invoice->due_date), // Fecha de vencimiento original
            'executed_date' => null,
            'original_due_date' => $invoice->due_date,
            'status' => Payment::STATUS_PENDING,
            'description' => "Cobro programado a la empresa {$company->business_name} por factura {$invoice->invoice_number} con comisión de confirming del {$commissionPercentage}%",
            'metadata' => [
                'operation_type' => 'confirming',
                'advance_request' => true,
                'original_amount' => $invoice->amount,
                'commission_applied' => $chargeAmount - $invoice->amount
            ]
        ]);
    }

    /**
     * Calculate supplier payment amount (invoice amount - discount).
     * 
     * @param float $invoiceAmount
     * @param float $discountPercentage
     * @return float
     */
    public function calculateSupplierPaymentAmount(float $invoiceAmount, float $discountPercentage): float
    {
        return $invoiceAmount * (1 - ($discountPercentage / 100));
    }

    /**
     * Calculate company charge amount (invoice amount + commission).
     * 
     * @param float $invoiceAmount
     * @param float $commissionPercentage
     * @return float
     */
    public function calculateCompanyChargeAmount(float $invoiceAmount, float $commissionPercentage): float
    {
        return $invoiceAmount * (1 + ($commissionPercentage / 100));
    }

    /**
     * Execute pending payments that are due.
     * 
     * @return array
     */
    public function executePendingPayments(): array
    {
        $duePayments = Payment::pending()
            ->where('scheduled_date', '<=', now())
            ->get();
        
        $results = [];
        
        foreach ($duePayments as $payment) {
            try {
                $this->executePayment($payment);
                $results[] = [
                    'payment_id' => $payment->id,
                    'status' => 'success',
                    'message' => 'Pago ejecutado exitosamente'
                ];
            } catch (\Exception $e) {
                $payment->markAsFailed();
                $results[] = [
                    'payment_id' => $payment->id,
                    'status' => 'failed',
                    'message' => $e->getMessage()
                ];
                
                Log::error('Error al ejecutar pago', [
                    'payment_id' => $payment->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
        
        return $results;
    }

    /**
     * Execute a specific payment.
     * 
     * @param Payment $payment
     * @return void
     */
    private function executePayment(Payment $payment): void
    {
        // Aquí se implementaría la lógica real de procesamiento de pagos
        // Por ahora, solo marcamos como ejecutado
        
        // Simular procesamiento de pago
        if ($payment->type === Payment::TYPE_PAYMENT_TO_SUPPLIER) {
            // Lógica para transferir dinero al proveedor
            Log::info('Ejecutando pago al proveedor', [
                'payment_id' => $payment->id,
                'amount' => $payment->amount,
                'supplier_id' => $payment->payee_id
            ]);
        } elseif ($payment->type === Payment::TYPE_CHARGE_TO_COMPANY) {
            // Lógica para cobrar a la empresa
            Log::info('Ejecutando cobro a la empresa', [
                'payment_id' => $payment->id,
                'amount' => $payment->amount,
                'company_id' => $payment->payer_id
            ]);
        }
        
        $payment->markAsExecuted();
    }

    /**
     * Get payments for a specific investment.
     * 
     * @param int $investmentId
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getPaymentsByInvestment(int $investmentId)
    {
        return Payment::where('investment_id', $investmentId)
            ->with(['payer', 'payee', 'invoice'])
            ->orderBy('scheduled_date')
            ->get();
    }

    /**
     * Get payment statistics.
     * 
     * @return array
     */
    public function getPaymentStatistics(): array
    {
        return [
            'total_payments' => Payment::count(),
            'pending_payments' => Payment::pending()->count(),
            'executed_payments' => Payment::executed()->count(),
            'failed_payments' => Payment::where('status', Payment::STATUS_FAILED)->count(),
            'total_amount_pending' => Payment::pending()->sum('amount'),
            'total_amount_executed' => Payment::executed()->sum('amount'),
        ];
    }
}