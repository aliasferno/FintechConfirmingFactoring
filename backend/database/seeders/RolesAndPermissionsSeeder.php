<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear permisos
        $permissions = [
            // Permisos de empresas
            ['name' => 'view_companies', 'display_name' => 'Ver Empresas', 'description' => 'Puede ver la lista de empresas', 'resource' => 'companies'],
            ['name' => 'create_company', 'display_name' => 'Crear Empresa', 'description' => 'Puede crear nuevas empresas', 'resource' => 'companies'],
            ['name' => 'edit_company', 'display_name' => 'Editar Empresa', 'description' => 'Puede editar información de empresas', 'resource' => 'companies'],
            ['name' => 'delete_company', 'display_name' => 'Eliminar Empresa', 'description' => 'Puede eliminar empresas', 'resource' => 'companies'],
            
            // Permisos de inversiones
            ['name' => 'view_investments', 'display_name' => 'Ver Inversiones', 'description' => 'Puede ver la lista de inversiones', 'resource' => 'investments'],
            ['name' => 'create_investment', 'display_name' => 'Crear Inversión', 'description' => 'Puede crear nuevas inversiones', 'resource' => 'investments'],
            ['name' => 'edit_investment', 'display_name' => 'Editar Inversión', 'description' => 'Puede editar inversiones', 'resource' => 'investments'],
            ['name' => 'delete_investment', 'display_name' => 'Eliminar Inversión', 'description' => 'Puede eliminar inversiones', 'resource' => 'investments'],
            
            // Permisos de inversores
            ['name' => 'view_investors', 'display_name' => 'Ver Inversores', 'description' => 'Puede ver la lista de inversores', 'resource' => 'investors'],
            ['name' => 'create_investor', 'display_name' => 'Crear Inversor', 'description' => 'Puede crear nuevos inversores', 'resource' => 'investors'],
            ['name' => 'edit_investor', 'display_name' => 'Editar Inversor', 'description' => 'Puede editar información de inversores', 'resource' => 'investors'],
            ['name' => 'delete_investor', 'display_name' => 'Eliminar Inversor', 'description' => 'Puede eliminar inversores', 'resource' => 'investors'],
            
            // Permisos de usuarios
            ['name' => 'view_users', 'display_name' => 'Ver Usuarios', 'description' => 'Puede ver la lista de usuarios', 'resource' => 'users'],
            ['name' => 'create_user', 'display_name' => 'Crear Usuario', 'description' => 'Puede crear nuevos usuarios', 'resource' => 'users'],
            ['name' => 'edit_user', 'display_name' => 'Editar Usuario', 'description' => 'Puede editar información de usuarios', 'resource' => 'users'],
            ['name' => 'delete_user', 'display_name' => 'Eliminar Usuario', 'description' => 'Puede eliminar usuarios', 'resource' => 'users'],
            ['name' => 'manage_users', 'display_name' => 'Gestionar Usuarios', 'description' => 'Puede gestionar usuarios del sistema', 'resource' => 'users'],
            
            // Permisos de facturas
            ['name' => 'view_invoices', 'display_name' => 'Ver Facturas', 'description' => 'Puede ver facturas', 'resource' => 'invoices'],
            ['name' => 'create_invoice', 'display_name' => 'Crear Factura', 'description' => 'Puede crear facturas', 'resource' => 'invoices'],
            ['name' => 'edit_invoice', 'display_name' => 'Editar Factura', 'description' => 'Puede editar facturas', 'resource' => 'invoices'],
            ['name' => 'delete_invoice', 'display_name' => 'Eliminar Factura', 'description' => 'Puede eliminar facturas', 'resource' => 'invoices'],
            
            // Permisos administrativos
            ['name' => 'manage_system', 'display_name' => 'Gestionar Sistema', 'description' => 'Puede gestionar configuraciones del sistema', 'resource' => 'system'],
            ['name' => 'view_reports', 'display_name' => 'Ver Reportes', 'description' => 'Puede ver reportes del sistema', 'resource' => 'reports'],
        ];
        
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }
        
        // Crear roles
        $adminRole = Role::firstOrCreate(
            ['name' => Role::ADMIN],
            [
                'display_name' => 'Administrador',
                'description' => 'Administrador del sistema con acceso completo'
            ]
        );
        
        $empresaRole = Role::firstOrCreate(
            ['name' => Role::EMPRESA],
            [
                'display_name' => 'Empresa',
                'description' => 'Usuario empresa que puede gestionar sus facturas e inversiones'
            ]
        );
        
        $inversorRole = Role::firstOrCreate(
            ['name' => Role::INVERSOR],
            [
                'display_name' => 'Inversor',
                'description' => 'Usuario inversor que puede realizar inversiones'
            ]
        );
        
        // Asignar todos los permisos al admin
        $allPermissions = Permission::all();
        $adminRole->permissions()->sync($allPermissions->pluck('id'));
        
        // Asignar permisos específicos a empresa
        $empresaPermissions = Permission::whereIn('name', [
            'view_investments', 'create_investment', 'edit_investment',
            'view_invoices', 'create_invoice', 'edit_invoice',
            'view_companies'
        ])->get();
        $empresaRole->permissions()->sync($empresaPermissions->pluck('id'));
        
        // Asignar permisos específicos a inversor
        $inversorPermissions = Permission::whereIn('name', [
            'view_investments', 'create_investment',
            'view_companies', 'view_investors'
        ])->get();
        $inversorRole->permissions()->sync($inversorPermissions->pluck('id'));
    }
}
