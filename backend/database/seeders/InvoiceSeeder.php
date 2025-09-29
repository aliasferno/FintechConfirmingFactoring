<?php

namespace Database\Seeders;

use App\Models\Invoice;
use App\Models\Company;
use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;

class InvoiceSeeder extends Seeder
{
    public function run(): void
    {
        // Crear rol de empresa si no existe
        $empresaRole = Role::firstOrCreate(
            ['name' => 'empresa'],
            ['display_name' => 'Empresa', 'description' => 'Rol para empresas']
        );
        
        // Buscar usuario empresa existente o crear uno nuevo
        $empresaUser = User::where('email', 'empresa@test.com')->first();
        if (!$empresaUser) {
            $empresaUser = User::factory()->create([
                'name' => 'Empresa Test',
                'email' => 'empresa@test.com',
                'user_type' => 'empresa',
                'role_id' => $empresaRole->id,
            ]);
        }
        
        // Buscar empresa existente o crear una nueva
        $company = $empresaUser->company;
        if (!$company) {
            $company = Company::factory()->create([
                'user_id' => $empresaUser->id,
                'business_name' => 'Empresa de Prueba S.A.S',
                'verification_status' => 'verified',
            ]);
        }

        // Crear facturas de factoring aprobadas
        Invoice::factory()
            ->count(5)
            ->factoring()
            ->approved()
            ->create([
                'company_id' => $company->id,
            ]);

        // Crear facturas de confirming aprobadas
        Invoice::factory()
            ->count(3)
            ->confirming()
            ->approved()
            ->create([
                'company_id' => $company->id,
            ]);

        // Crear algunas facturas pendientes
        Invoice::factory()
            ->count(2)
            ->factoring()
            ->pending()
            ->create([
                'company_id' => $company->id,
            ]);

        Invoice::factory()
            ->count(2)
            ->confirming()
            ->pending()
            ->create([
                'company_id' => $company->id,
            ]);
    }
}