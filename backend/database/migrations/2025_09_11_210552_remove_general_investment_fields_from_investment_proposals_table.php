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
            // Eliminar campos generales de inversión
            $table->dropColumn([
                'proposed_amount',
                'proposed_interest_rate',
                'proposed_term_days',
                'proposed_discount_rate',
                'proposed_commission_rate',
                'negotiation_terms',
                'investor_comments',
                'expires_at',
                'original_terms',
                'counter_offer_terms',
                'is_counter_offer',
                'parent_proposal_id'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('investment_proposals', function (Blueprint $table) {
            // Restaurar campos generales de inversión
            $table->decimal('proposed_amount', 15, 2)->nullable();
            $table->decimal('proposed_interest_rate', 5, 4)->nullable();
            $table->integer('proposed_term_days')->nullable();
            $table->decimal('proposed_discount_rate', 5, 4)->nullable();
            $table->decimal('proposed_commission_rate', 5, 4)->nullable();
            $table->text('negotiation_terms')->nullable();
            $table->text('investor_comments')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->json('original_terms')->nullable();
            $table->json('counter_offer_terms')->nullable();
            $table->boolean('is_counter_offer')->default(false);
            $table->unsignedBigInteger('parent_proposal_id')->nullable();
        });
    }
};
