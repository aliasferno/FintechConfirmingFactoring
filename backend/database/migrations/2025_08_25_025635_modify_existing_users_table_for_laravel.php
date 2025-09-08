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
        Schema::table('users', function (Blueprint $table) {
            // Rename existing column
            $table->renameColumn('password_hash', 'password');
            
            // Add missing Laravel columns
            $table->string('name')->after('id');
            $table->timestamp('email_verified_at')->nullable()->after('email');
            $table->string('remember_token', 100)->nullable()->after('password');
            
            // Add new profile fields
            $table->string('phone', 20)->nullable()->after('remember_token');
            $table->date('date_of_birth')->nullable()->after('phone');
            $table->string('identification_number', 50)->nullable()->after('date_of_birth');
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])->default('pending')->after('identification_number');
            
            // Drop columns that are not needed in Laravel structure
            $table->dropColumn(['role_id', 'is_validated']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Restore original structure
            $table->renameColumn('password', 'password_hash');
            $table->integer('role_id');
            $table->boolean('is_validated')->default(false);
            
            // Drop Laravel columns
            $table->dropColumn([
                'name',
                'email_verified_at',
                'remember_token',
                'phone',
                'date_of_birth',
                'identification_number',
                'verification_status'
            ]);
        });
    }
};
