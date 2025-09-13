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
            // Campos específicos de factoring
            $table->decimal('advance_percentage', 5, 2)->nullable()->comment('Porcentaje de adelanto (70-90%)');
            $table->decimal('factoring_commission', 5, 2)->nullable()->comment('Comisión de factoring (0.5-10%)');
            $table->enum('risk_assessment', ['low', 'medium', 'high'])->nullable()->comment('Evaluación de riesgo del cliente');
            $table->enum('factoring_type', ['with_recourse', 'without_recourse', 'international'])->nullable()->comment('Tipo de factoring');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('investment_proposals', function (Blueprint $table) {
            // Eliminar campos específicos de factoring
            $table->dropColumn([
                'advance_percentage',
                'factoring_commission',
                'risk_assessment',
                'factoring_type'
            ]);
        });
    }
};
