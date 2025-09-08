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
        Schema::table('invoices', function (Blueprint $table) {
            // Campos específicos para Factoring
            $table->decimal('advance_percentage', 5, 2)->nullable()->after('description');
            $table->decimal('commission_rate', 5, 4)->nullable()->after('advance_percentage');
            $table->date('expected_collection_date')->nullable()->after('commission_rate');
            $table->enum('credit_risk_assessment', ['low', 'medium', 'high'])->nullable()->after('expected_collection_date');
            
            // Campos específicos para Confirming
            $table->string('supplier_name')->nullable()->after('credit_risk_assessment');
            $table->string('supplier_tax_id')->nullable()->after('supplier_name');
            $table->string('payment_terms')->nullable()->after('supplier_tax_id');
            $table->decimal('early_payment_discount', 5, 2)->nullable()->after('payment_terms');
            $table->date('confirmation_deadline')->nullable()->after('early_payment_discount');
            
            // Índices para mejorar el rendimiento
            $table->index('expected_collection_date');
            $table->index('confirmation_deadline');
            $table->index('credit_risk_assessment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Eliminar índices
            $table->dropIndex(['expected_collection_date']);
            $table->dropIndex(['confirmation_deadline']);
            $table->dropIndex(['credit_risk_assessment']);
            
            // Eliminar columnas
            $table->dropColumn([
                'advance_percentage',
                'commission_rate',
                'expected_collection_date',
                'credit_risk_assessment',
                'supplier_name',
                'supplier_tax_id',
                'payment_terms',
                'early_payment_discount',
                'confirmation_deadline'
            ]);
        });
    }
};
