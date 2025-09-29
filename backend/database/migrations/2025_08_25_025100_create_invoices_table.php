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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('users')->onDelete('cascade');
            $table->string('invoice_number');
            $table->string('client_name');
            $table->string('client_tax_id');
            $table->decimal('amount', 15, 2);
            $table->date('issue_date');
            $table->date('due_date');
            $table->enum('status', ['pending', 'approved', 'funded', 'paid', 'rejected', 'expired'])->default('pending');
            $table->integer('risk_score')->nullable();
            $table->decimal('discount_rate', 5, 4)->nullable();
            $table->decimal('net_amount', 15, 2)->nullable();
            $table->string('document_path')->nullable();
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->timestamps();
            
            // Índices
            $table->index('status');
            $table->index('verification_status');
            $table->index('due_date');
            $table->index('company_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};