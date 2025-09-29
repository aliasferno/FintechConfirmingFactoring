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
            // Eliminar la foreign key incorrecta
            $table->dropForeign(['company_id']);
            
            // Agregar la foreign key correcta que referencia la tabla companies
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Eliminar la foreign key correcta
            $table->dropForeign(['company_id']);
            
            // Restaurar la foreign key incorrecta (para rollback)
            $table->foreign('company_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
};