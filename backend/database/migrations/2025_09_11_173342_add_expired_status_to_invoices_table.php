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
        // Modificar el enum para incluir 'expired'
        DB::statement("ALTER TABLE invoices DROP CONSTRAINT invoices_status_check");
        DB::statement("ALTER TABLE invoices ADD CONSTRAINT invoices_status_check CHECK (status IN ('pending', 'approved', 'funded', 'paid', 'rejected', 'expired'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revertir el enum al estado original
        DB::statement("ALTER TABLE invoices DROP CONSTRAINT invoices_status_check");
        DB::statement("ALTER TABLE invoices ADD CONSTRAINT invoices_status_check CHECK (status IN ('pending', 'approved', 'funded', 'paid', 'rejected'))");
    }
};
