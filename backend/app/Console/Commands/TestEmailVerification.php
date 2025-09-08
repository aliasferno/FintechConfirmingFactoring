<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Notifications\CustomVerifyEmail;

class TestEmailVerification extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'test:email-verification {user_id}';

    /**
     * The console command description.
     */
    protected $description = 'Test email verification notification for a specific user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $userId = $this->argument('user_id');
        
        $user = User::find($userId);
        
        if (!$user) {
            $this->error("User with ID {$userId} not found.");
            return 1;
        }
        
        $this->info("Sending email verification to: {$user->email}");
        $this->info("User type: {$user->user_type}");
        $this->info("User name: {$user->name}");
        
        try {
            $user->sendEmailVerificationNotification();
            $this->info('Email verification notification sent successfully!');
            $this->info('Check the Laravel logs to see the email content.');
        } catch (\Exception $e) {
            $this->error('Failed to send email verification: ' . $e->getMessage());
            return 1;
        }
        
        return 0;
    }
}