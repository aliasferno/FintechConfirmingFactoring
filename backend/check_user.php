<?php

require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = App\Models\User::find(25);
if($user) {
    echo 'Usuario encontrado: ' . $user->name . ' (' . $user->email . ')' . PHP_EOL;
    $company = $user->company;
    if($company) {
        echo 'Empresa asociada: ID ' . $company->id . ' - ' . $company->business_name . PHP_EOL;
    } else {
        echo 'El usuario NO tiene empresa asociada' . PHP_EOL;
    }
} else {
    echo 'Usuario ID 25 no encontrado' . PHP_EOL;
}