<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class GenerateTestToken extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:generate-token {--user-id=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate a test token for API testing';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $userId = $this->option('user-id');
        
        if ($userId) {
            $user = User::find($userId);
            if (!$user) {
                $this->error("User with ID {$userId} not found.");
                return 1;
            }
        } else {
            $user = User::first();
            if (!$user) {
                $this->error('No users found in the database.');
                return 1;
            }
        }

        $token = $user->createToken('test-token')->plainTextToken;
        
        $this->info('Test token generated successfully!');
        $this->line('User: ' . $user->name . ' (' . $user->email . ')');
        $this->line('Role: ' . ($user->role ? $user->role->display_name : 'No role assigned'));
        $this->line('Token: ' . $token);
        
        return 0;
    }
}
