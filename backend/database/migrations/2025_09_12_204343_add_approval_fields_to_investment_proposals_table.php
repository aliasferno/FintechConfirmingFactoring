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
        Schema::table('investment_proposals', function (Blueprint $table) {
            // Agregar nuevos campos de timestamps y notas
            $table->timestamp('sent_at')->nullable()->after('status');
            $table->timestamp('approved_at')->nullable()->after('sent_at');
            $table->timestamp('rejected_at')->nullable()->after('approved_at');
            $table->text('rejection_reason')->nullable()->after('rejected_at');
            $table->text('approval_notes')->nullable()->after('rejection_reason');
        });
        
        // Actualizar el enum del status para incluir 'sent' y 'draft'
        DB::statement("ALTER TABLE investment_proposals DROP CONSTRAINT investment_proposals_status_check");
        DB::statement("ALTER TABLE investment_proposals ADD CONSTRAINT investment_proposals_status_check CHECK (status IN ('draft', 'sent', 'pending', 'approved', 'rejected', 'counter_offered', 'expired'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('investment_proposals', function (Blueprint $table) {
            $table->dropColumn([
                'sent_at',
                'approved_at',
                'rejected_at',
                'rejection_reason',
                'approval_notes'
            ]);
        });
        
        // Restaurar el enum original del status
        DB::statement("ALTER TABLE investment_proposals DROP CONSTRAINT investment_proposals_status_check");
        DB::statement("ALTER TABLE investment_proposals ADD CONSTRAINT investment_proposals_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'counter_offered', 'expired'))");
    }
};
