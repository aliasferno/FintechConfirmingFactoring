<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // First, update all NULL values to false
            DB::statement('UPDATE invoices SET supplier_notification = false WHERE supplier_notification IS NULL');
            DB::statement('UPDATE invoices SET advance_request = false WHERE advance_request IS NULL');
            
            // Then modify the columns to be NOT NULL with default values
            $table->boolean('supplier_notification')->default(false)->change();
            $table->boolean('advance_request')->default(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Revert the columns to nullable
            $table->boolean('supplier_notification')->nullable()->change();
            $table->boolean('advance_request')->nullable()->change();
        });
    }
};
