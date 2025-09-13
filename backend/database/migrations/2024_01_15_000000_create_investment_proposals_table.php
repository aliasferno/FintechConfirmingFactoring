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
        Schema::create('investment_proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('investor_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('invoice_id')->constrained()->onDelete('cascade');
            $table->decimal('proposed_amount', 15, 2);
            $table->decimal('proposed_interest_rate', 5, 4); // Tasa de interés propuesta
            $table->integer('proposed_term_days'); // Plazo propuesto en días
            $table->decimal('proposed_discount_rate', 5, 4)->nullable(); // Tasa de descuento propuesta
            $table->decimal('proposed_commission_rate', 5, 4)->nullable(); // Comisión propuesta
            $table->text('negotiation_terms')->nullable(); // Términos adicionales de negociación
            $table->text('investor_comments')->nullable(); // Comentarios del inversor
            $table->enum('status', ['pending', 'approved', 'rejected', 'counter_offered', 'expired'])->default('pending');
            $table->text('company_response')->nullable(); // Respuesta de la empresa
            $table->timestamp('expires_at')->nullable(); // Fecha de expiración de la propuesta
            $table->timestamp('responded_at')->nullable(); // Fecha de respuesta de la empresa
            $table->foreignId('responded_by')->nullable()->constrained('users')->onDelete('set null'); // Usuario que respondió
            $table->json('original_terms')->nullable(); // Términos originales para comparación
            $table->json('counter_offer_terms')->nullable(); // Términos de contraoferta
            $table->boolean('is_counter_offer')->default(false); // Si es una contraoferta
            $table->foreignId('parent_proposal_id')->nullable()->constrained('investment_proposals')->onDelete('cascade'); // Propuesta padre si es contraoferta
            $table->timestamps();
            
            // Índices para optimizar consultas
            $table->index(['investor_id', 'status']);
            $table->index(['invoice_id', 'status']);
            $table->index(['status', 'expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('investment_proposals');
    }
};