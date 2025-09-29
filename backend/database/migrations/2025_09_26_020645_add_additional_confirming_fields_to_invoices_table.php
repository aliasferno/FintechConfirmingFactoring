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
            // Campos adicionales específicos para Confirming
            $table->enum('confirming_type', ['confirmed', 'reverse'])->nullable()->after('confirmation_deadline');
            $table->decimal('confirming_commission', 5, 2)->nullable()->after('confirming_type');
            $table->enum('guarantee_type', ['none', 'bank_guarantee', 'insurance', 'collateral'])->nullable()->after('confirming_commission');
            $table->enum('payment_guarantee', ['none', 'bank_guarantee', 'insurance', 'collateral'])->nullable()->after('guarantee_type');
            $table->boolean('supplier_notification')->default(false)->after('payment_guarantee');
            $table->boolean('advance_request')->default(false)->after('supplier_notification');
            
            // Índices para mejorar el rendimiento
            $table->index('confirming_type');
            $table->index('guarantee_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Eliminar índices
            $table->dropIndex(['confirming_type']);
            $table->dropIndex(['guarantee_type']);
            
            // Eliminar columnas
            $table->dropColumn([
                'confirming_type',
                'confirming_commission',
                'guarantee_type',
                'payment_guarantee',
                'supplier_notification',
                'advance_request',
            ]);
        });
    }
};
