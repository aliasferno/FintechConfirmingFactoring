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
        Schema::create('investors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('investor_type', ['individual', 'institutional', 'corporate'])->default('individual');
            $table->enum('risk_tolerance', ['low', 'medium', 'high'])->default('medium');
            $table->enum('investment_experience', ['beginner', 'intermediate', 'advanced'])->default('beginner');
            $table->json('preferred_sectors')->nullable();
            $table->decimal('minimum_investment', 15, 2)->default(1000.00);
            $table->decimal('maximum_investment', 15, 2)->nullable();
            $table->enum('investment_horizon', ['short', 'medium', 'long'])->default('medium');
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->boolean('accredited_investor')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('investors');
    }
};
