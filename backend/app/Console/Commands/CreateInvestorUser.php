<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class CreateInvestorUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'create:investor-user';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create an investor user for testing';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $inversorRole = Role::where('name', 'inversor')->first();
        
        if (!$inversorRole) {
            $this->error('Inversor role not found.');
            return 1;
        }
        
        $user = User::create([
            'name' => 'Investor User',
            'email' => 'investor@test.com',
            'password' => Hash::make('password'),
            'user_type' => 'inversor',
            'role_id' => $inversorRole->id
        ]);
        
        $this->info('Investor user created successfully!');
        $this->line('Email: investor@test.com');
        $this->line('Password: password');
        $this->line('User ID: ' . $user->id);
        
        return 0;
    }
}
