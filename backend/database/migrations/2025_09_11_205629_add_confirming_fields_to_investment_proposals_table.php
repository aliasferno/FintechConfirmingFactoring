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
        Schema::table('investment_proposals', function (Blueprint $table) {
            // Campos específicos de confirming
            $table->string('payment_terms')->nullable()->comment('Términos de pago para confirming');
            $table->enum('guarantee_type', ['bank_guarantee', 'insurance', 'collateral', 'surety_bond', 'none'])->nullable()->comment('Tipo de garantía');
            $table->enum('confirming_type', ['with_recourse', 'without_recourse', 'international'])->nullable()->comment('Tipo de confirming');
            $table->boolean('supplier_notification')->default(false)->comment('Notificación automática a proveedores');
            $table->boolean('advance_request')->default(false)->comment('Solicitud de adelanto de pago');
            $table->decimal('confirming_commission', 5, 2)->nullable()->comment('Comisión de confirming (%)');
            $table->string('payment_guarantee')->nullable()->comment('Garantía de pago');
            $table->decimal('early_payment_discount', 5, 2)->nullable()->comment('Descuento por pago anticipado (%)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('investment_proposals', function (Blueprint $table) {
            // Eliminar campos específicos de confirming
            $table->dropColumn([
                'payment_terms',
                'guarantee_type',
                'confirming_type',
                'supplier_notification',
                'advance_request',
                'confirming_commission',
                'payment_guarantee',
                'early_payment_discount'
            ]);
        });
    }
};
