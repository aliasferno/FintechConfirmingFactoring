<?php

namespace Database\Seeders;

use App\Models\Investment;
use App\Models\Invoice;
use App\Models\User;
use App\Models\Role;
use App\Models\Investor;
use Illuminate\Database\Seeder;

class InvestmentSeeder extends Seeder
{
    public function run(): void
    {
        // Crear rol de inversor si no existe
        $inversorRole = Role::firstOrCreate(
            ['name' => 'inversor'],
            ['display_name' => 'Inversor', 'description' => 'Rol para inversores']
        );
        
        // Crear usuarios inversores de prueba
        $inversores = [];
        
        // Inversor 1
        $inversor1 = User::where('email', 'inversor1@test.com')->first();
        if (!$inversor1) {
            $inversor1 = User::factory()->create([
                'name' => 'Juan Pérez',
                'email' => 'inversor1@test.com',
                'user_type' => 'inversor',
                'role_id' => $inversorRole->id,
            ]);
            
            // Crear perfil de inversor
            Investor::factory()->create([
                'user_id' => $inversor1->id,
                'investor_type' => 'individual',
                'risk_tolerance' => 'medium',
                'investment_capacity' => 500000,
                'minimum_investment' => 5000,
                'maximum_investment' => 50000,
                'verification_status' => 'verified',
            ]);
        }
        $inversores[] = $inversor1;
        
        // Inversor 2
        $inversor2 = User::where('email', 'inversor2@test.com')->first();
        if (!$inversor2) {
            $inversor2 = User::factory()->create([
                'name' => 'María González',
                'email' => 'inversor2@test.com',
                'user_type' => 'inversor',
                'role_id' => $inversorRole->id,
            ]);
            
            // Crear perfil de inversor
            Investor::factory()->create([
                'user_id' => $inversor2->id,
                'investor_type' => 'individual',
                'risk_tolerance' => 'low',
                'investment_capacity' => 300000,
                'minimum_investment' => 10000,
                'maximum_investment' => 30000,
                'verification_status' => 'verified',
            ]);
        }
        $inversores[] = $inversor2;
        
        // Inversor 3 - Institucional
        $inversor3 = User::where('email', 'inversor3@test.com')->first();
        if (!$inversor3) {
            $inversor3 = User::factory()->create([
                'name' => 'Fondo de Inversión ABC',
                'email' => 'inversor3@test.com',
                'user_type' => 'inversor',
                'role_id' => $inversorRole->id,
            ]);
            
            // Crear perfil de inversor
            Investor::factory()->create([
                'user_id' => $inversor3->id,
                'investor_type' => 'institutional',
                'risk_tolerance' => 'high',
                'investment_capacity' => 2000000,
                'minimum_investment' => 50000,
                'maximum_investment' => 200000,
                'verification_status' => 'verified',
            ]);
        }
        $inversores[] = $inversor3;

        // Obtener facturas aprobadas para invertir
        $facturasAprobadas = Invoice::where('status', 'approved')->get();
        
        if ($facturasAprobadas->isEmpty()) {
            $this->command->warn('No hay facturas aprobadas. Ejecuta primero el InvoiceSeeder.');
            return;
        }

        // Crear inversiones para cada factura aprobada
        foreach ($facturasAprobadas as $factura) {
            // Determinar cuántas inversiones crear para esta factura (1-3)
            $numInversiones = rand(1, 3);
            $montoRestante = $factura->amount;
            
            for ($i = 0; $i < $numInversiones && $montoRestante > 1000; $i++) {
                $inversor = $inversores[array_rand($inversores)];
                
                // Calcular monto de inversión (entre 10% y 60% del monto restante)
                $porcentajeInversion = rand(10, 60) / 100;
                $montoInversion = min($montoRestante * $porcentajeInversion, $montoRestante);
                
                // Asegurar que el monto esté dentro de los límites del inversor
                $investorProfile = $inversor->investor;
                if ($investorProfile) {
                    $montoInversion = max($montoInversion, $investorProfile->minimum_investment ?? 5000);
                    $montoInversion = min($montoInversion, $investorProfile->maximum_investment ?? 100000);
                }
                
                // Redondear a 2 decimales
                $montoInversion = round($montoInversion, 2);
                
                if ($montoInversion > $montoRestante) {
                    $montoInversion = $montoRestante;
                }
                
                // Determinar tasa de retorno basada en el tipo de operación
                $returnRate = 0.08; // 8% por defecto
                if ($factura->operation_type === 'factoring') {
                    $returnRate = rand(60, 120) / 1000; // 6% - 12%
                } elseif ($factura->operation_type === 'confirming') {
                    $returnRate = rand(40, 80) / 1000; // 4% - 8%
                }
                
                // Determinar estado de la inversión
                $estados = ['active', 'active', 'active', 'completed', 'active']; // Más activas que completadas
                $estado = $estados[array_rand($estados)];
                
                // Crear la inversión
                $investment = Investment::factory()
                    ->withAmount($montoInversion, $montoInversion)
                    ->withReturnRate($returnRate)
                    ->create([
                        'user_id' => $inversor->id,
                        'invoice_id' => $factura->id,
                        'status' => $estado,
                    ]);
                
                // Si está completada, asignar retorno real
                if ($estado === 'completed') {
                    $actualReturn = $investment->expected_return * rand(95, 105) / 100; // ±5% de variación
                    $investment->update(['actual_return' => round($actualReturn, 2)]);
                }
                
                $montoRestante -= $montoInversion;
                
                $this->command->info("Inversión creada: {$inversor->name} invirtió \${$montoInversion} en factura {$factura->invoice_number}");
            }
        }
        
        // Crear inversiones de prueba para el usuario actual (Fernando Carrión - user_id=8)
        $currentUser = User::find(8);
        if ($currentUser) {
            // Obtener facturas disponibles
            $facturas = Invoice::where('status', 'approved')->get();
            
            if ($facturas->count() > 0) {
                foreach ($facturas->take(2) as $index => $factura) {
                    $montoInversion = $factura->amount * (0.3 + ($index * 0.2)); // 30% y 50% de la factura
                    $tasaRetorno = 0.08 + ($index * 0.02); // 8% y 10%
                    $retornoEsperado = $montoInversion * (1 + $tasaRetorno);
                    
                    $fechaInversion = now()->subDays(rand(1, 30));
                    $fechaVencimiento = $fechaInversion->copy()->addDays(rand(30, 90));
                    
                    $investment = Investment::create([
                        'user_id' => $currentUser->id,
                        'invoice_id' => $factura->id,
                        'amount' => $montoInversion,
                        'expected_return' => $retornoEsperado - $montoInversion,
                        'investment_date' => $fechaInversion,
                        'maturity_date' => $fechaVencimiento,
                        'status' => $index == 0 ? 'active' : 'completed',
                        'return_rate' => $tasaRetorno,
                        'actual_return' => $index == 1 ? ($retornoEsperado - $montoInversion) : null,
                    ]);
                    
                    echo "Inversión creada para usuario actual: {$currentUser->name} invirtió $" . number_format($montoInversion, 2) . " en factura {$factura->invoice_number}\n";
                }
            }
        }
        $this->command->info('InvestmentSeeder completado exitosamente.');
    }
}