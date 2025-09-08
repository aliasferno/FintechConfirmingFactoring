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
            // Rename user_id to company_id
            $table->renameColumn('user_id', 'company_id');
            
            // Add missing columns
            $table->string('client_name')->after('invoice_number');
            $table->string('client_tax_id')->after('client_name');
            $table->date('issue_date')->after('amount');
            $table->enum('status', ['pending', 'approved', 'funded', 'paid', 'rejected'])->default('pending')->after('due_date');
            $table->integer('risk_score')->nullable()->after('status');
            $table->decimal('discount_rate', 5, 4)->nullable()->after('risk_score');
            $table->decimal('net_amount', 15, 2)->nullable()->after('discount_rate');
            $table->string('document_path')->nullable()->after('net_amount');
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])->default('pending')->after('document_path');
            
            // Drop columns that are not needed
            $table->dropColumn(['negotiation_status', 'negotiated_amount', 'deleted_at']);
            
            // Add indexes
            $table->index('status');
            $table->index('verification_status');
            $table->index('due_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Restore original structure
            $table->renameColumn('company_id', 'user_id');
            $table->string('negotiation_status');
            $table->decimal('negotiated_amount', 15, 2)->nullable();
            $table->timestamp('deleted_at')->nullable();
            
            // Drop added columns
            $table->dropColumn([
                'client_name',
                'client_tax_id',
                'issue_date',
                'status',
                'risk_score',
                'discount_rate',
                'net_amount',
                'document_path',
                'verification_status'
            ]);
            
            // Drop indexes
            $table->dropIndex(['status']);
            $table->dropIndex(['verification_status']);
            $table->dropIndex(['due_date']);
        });
    }
};
