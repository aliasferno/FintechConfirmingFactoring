<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            
            // Relaciones
            $table->foreignId('investment_id')->constrained()->onDelete('cascade');
            $table->foreignId('invoice_id')->constrained()->onDelete('cascade');
            $table->foreignId('payer_id')->constrained('users')->onDelete('cascade'); // Quien paga (inversor)
            $table->foreignId('payee_id')->constrained('users')->onDelete('cascade'); // Quien recibe (proveedor o empresa)
            
            // Información del pago
            $table->enum('type', ['payment_to_supplier', 'charge_to_company'])->comment('Tipo de transacción');
            $table->decimal('amount', 15, 2)->comment('Monto del pago/cobro');
            $table->decimal('original_invoice_amount', 15, 2)->comment('Monto original de la factura');
            $table->decimal('discount_percentage', 5, 2)->nullable()->comment('Porcentaje de descuento aplicado');
            $table->decimal('commission_percentage', 5, 2)->nullable()->comment('Porcentaje de comisión aplicado');
            
            // Fechas
            $table->datetime('scheduled_date')->comment('Fecha programada para el pago/cobro');
            $table->datetime('executed_date')->nullable()->comment('Fecha real de ejecución');
            $table->date('original_due_date')->comment('Fecha de vencimiento original de la factura');
            
            // Estado y control
            $table->enum('status', ['pending', 'executed', 'failed', 'cancelled'])->default('pending');
            $table->text('description')->nullable()->comment('Descripción del pago/cobro');
            $table->json('metadata')->nullable()->comment('Información adicional en formato JSON');
            
            $table->timestamps();
            
            // Índices
            $table->index(['type', 'status']);
            $table->index(['scheduled_date', 'status']);
            $table->index(['investment_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
