<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'create:admin-user';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create an admin user for testing';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $adminRole = Role::where('name', 'admin')->first();
        
        if (!$adminRole) {
            $this->error('Admin role not found.');
            return 1;
        }
        
        $user = User::create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'user_type' => 'admin',
            'role_id' => $adminRole->id
        ]);
        
        $this->info('Admin user created successfully!');
        $this->line('Email: admin@test.com');
        $this->line('Password: password');
        $this->line('User ID: ' . $user->id);
        
        return 0;
    }
}
