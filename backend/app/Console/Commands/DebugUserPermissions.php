<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class DebugUserPermissions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'debug:user-permissions {user-id}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Debug user permissions';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $userId = $this->argument('user-id');
        $user = User::with(['role.permissions'])->find($userId);
        
        if (!$user) {
            $this->error("User with ID {$userId} not found.");
            return 1;
        }
        
        $this->info("User: {$user->name} ({$user->email})");
        $this->info("Role: " . ($user->role ? $user->role->display_name : 'No role'));
        
        if ($user->role) {
            $this->info("Role permissions:");
            foreach ($user->role->permissions as $permission) {
                $this->line("  - {$permission->name} ({$permission->display_name})");
            }
            
            $this->info("\nTesting specific permissions:");
            $testPermissions = ['view_companies', 'create_company', 'view_investments'];
            
            foreach ($testPermissions as $permission) {
                $hasPermission = $user->role->permissions()->where('name', $permission)->exists();
                $status = $hasPermission ? '✓' : '✗';
                $this->line("  {$status} {$permission}");
            }
        }
        
        return 0;
    }
}
