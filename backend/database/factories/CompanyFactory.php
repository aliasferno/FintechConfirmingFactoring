<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CompanyFactory extends Factory
{
    protected $model = Company::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'business_name' => $this->faker->company(),
            'tax_id' => $this->faker->numerify('##########'),
            'business_type' => $this->faker->randomElement([
                'Manufactura',
                'Servicios',
                'Comercio',
                'Construcción',
                'Tecnología',
                'Salud',
                'Educación',
                'Transporte',
                'Agricultura',
                'Otros'
            ]),
            'address' => $this->faker->address(),
            'phone' => $this->faker->phoneNumber(),
            'monthly_revenue' => $this->faker->randomFloat(2, 50000, 5000000),
            'years_in_business' => $this->faker->numberBetween(1, 50),
            'verification_status' => 'verified',
            'credit_score' => $this->faker->numberBetween(600, 850),
        ];
    }

    public function verified(): static
    {
        return $this->state(fn (array $attributes) => [
            'verification_status' => 'verified',
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'verification_status' => 'pending',
        ]);
    }
}