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
            // Drop the incorrect foreign key constraint
            $table->dropForeign('invoices_user_id_fkey');
            
            // Add the correct foreign key constraint pointing to companies table
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Drop the correct foreign key constraint
            $table->dropForeign(['company_id']);
            
            // Restore the original (incorrect) foreign key constraint
            $table->foreign('company_id', 'invoices_user_id_fkey')->references('id')->on('users')->onDelete('cascade');
        });
    }
};
