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
        // Remove the unique constraint on email and user_type
        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_user_type_unique');
        
        // Remove the check constraint on user_type
        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check');
        
        // Add back the simple email unique constraint
        Schema::table('users', function (Blueprint $table) {
            $table->unique('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove the simple email unique constraint
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['email']);
        });
        
        // Note: We don't restore the old constraints as they depend on user_type column
        // which should not exist after the revert
    }
};