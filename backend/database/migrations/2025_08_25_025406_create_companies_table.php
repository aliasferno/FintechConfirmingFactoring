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
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('business_name');
            $table->string('tax_id')->unique();
            $table->enum('business_type', [
                'Manufactura',
                'Servicios',
                'Comercio',
                'Construcción',
                'Tecnología',
                'Salud',
                'Educación',
                'Transporte',
                'Agricultura',
                'Otros'
            ]);
            $table->text('address');
            $table->string('phone');
            $table->decimal('monthly_revenue', 15, 2)->nullable();
            $table->integer('years_in_business')->nullable();
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->integer('credit_score')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
