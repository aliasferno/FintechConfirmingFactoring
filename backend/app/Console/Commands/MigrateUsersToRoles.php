<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Role;

class MigrateUsersToRoles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:migrate-to-roles';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrar usuarios existentes al nuevo sistema de roles basado en su user_type';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando migración de usuarios al sistema de roles...');
        
        // Obtener todos los roles
        $empresaRole = Role::where('name', Role::EMPRESA)->first();
        $inversorRole = Role::where('name', Role::INVERSOR)->first();
        $adminRole = Role::where('name', Role::ADMIN)->first();
        
        if (!$empresaRole || !$inversorRole || !$adminRole) {
            $this->error('Los roles no están creados. Ejecuta primero el seeder RolesAndPermissionsSeeder.');
            return 1;
        }
        
        // Obtener usuarios sin rol asignado
        $users = User::whereNull('role_id')->get();
        
        if ($users->isEmpty()) {
            $this->info('No hay usuarios para migrar.');
            return 0;
        }
        
        $migratedCount = 0;
        $bar = $this->output->createProgressBar($users->count());
        $bar->start();
        
        foreach ($users as $user) {
            $roleId = null;
            
            switch ($user->user_type) {
                case 'empresa':
                    $roleId = $empresaRole->id;
                    break;
                case 'inversor':
                    $roleId = $inversorRole->id;
                    break;
                case 'admin':
                    $roleId = $adminRole->id;
                    break;
                default:
                    // Si no tiene un tipo válido, asignar rol de empresa por defecto
                    $roleId = $empresaRole->id;
                    $this->warn("Usuario {$user->email} no tiene user_type válido, asignando rol empresa por defecto.");
                    break;
            }
            
            $user->update(['role_id' => $roleId]);
            $migratedCount++;
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine();
        $this->info("Migración completada. {$migratedCount} usuarios migrados al sistema de roles.");
        
        // Mostrar resumen
        $empresaCount = User::where('role_id', $empresaRole->id)->count();
        $inversorCount = User::where('role_id', $inversorRole->id)->count();
        $adminCount = User::where('role_id', $adminRole->id)->count();
        
        $this->table(
            ['Rol', 'Cantidad de Usuarios'],
            [
                ['Empresa', $empresaCount],
                ['Inversor', $inversorCount],
                ['Admin', $adminCount],
            ]
        );
        
        return 0;
    }
}
