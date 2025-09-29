<?php

require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Simulando endpoint companyProposals para usuario ID 25 ===" . PHP_EOL;

$user = App\Models\User::find(25);
if (!$user) {
    echo "Usuario no encontrado" . PHP_EOL;
    exit;
}

echo "Usuario: " . $user->name . " (" . $user->email . ")" . PHP_EOL;

// Buscar la empresa del usuario
$company = $user->company;
if (!$company) {
    echo "Usuario no pertenece a ninguna empresa" . PHP_EOL;
    exit;
}

echo "Empresa: ID " . $company->id . " - " . $company->business_name . PHP_EOL;

// Simular la consulta del endpoint
$query = App\Models\InvestmentProposal::with(['investor', 'invoice', 'respondedBy'])
    ->whereHas('invoice', function ($q) use ($company) {
        $q->where('company_id', $company->id);
    });

// Por defecto, mostrar solo las enviadas y pendientes
$query->whereIn('status', [App\Models\InvestmentProposal::STATUS_SENT, App\Models\InvestmentProposal::STATUS_PENDING]);

$proposals = $query->orderBy('sent_at', 'desc')
                  ->orderBy('created_at', 'desc')
                  ->get();

echo "Total de propuestas encontradas con filtro por defecto (sent, pending): " . $proposals->count() . PHP_EOL;

if ($proposals->count() > 0) {
    foreach ($proposals as $proposal) {
        echo "- Propuesta ID: " . $proposal->id . PHP_EOL;
        echo "  Estado: " . $proposal->status . PHP_EOL;
        echo "  Monto: $" . number_format($proposal->amount, 2) . PHP_EOL;
        echo "  Factura ID: " . $proposal->invoice_id . PHP_EOL;
        echo "  Enviada: " . ($proposal->sent_at ? $proposal->sent_at : 'No enviada') . PHP_EOL;
        echo "  ---" . PHP_EOL;
    }
} else {
    echo "No se encontraron propuestas con el filtro por defecto" . PHP_EOL;
}

// Verificar qué constantes están definidas
echo PHP_EOL . "=== Verificando constantes de estado ===" . PHP_EOL;
echo "STATUS_SENT: " . App\Models\InvestmentProposal::STATUS_SENT . PHP_EOL;
echo "STATUS_PENDING: " . App\Models\InvestmentProposal::STATUS_PENDING . PHP_EOL;

// Verificar todas las propuestas sin filtro
echo PHP_EOL . "=== Todas las propuestas sin filtro ===" . PHP_EOL;
$allProposals = App\Models\InvestmentProposal::with(['investor', 'invoice', 'respondedBy'])
    ->whereHas('invoice', function ($q) use ($company) {
        $q->where('company_id', $company->id);
    })
    ->get();

echo "Total de propuestas sin filtro: " . $allProposals->count() . PHP_EOL;
foreach ($allProposals as $proposal) {
    echo "- Propuesta ID: " . $proposal->id . " - Estado: " . $proposal->status . PHP_EOL;
}