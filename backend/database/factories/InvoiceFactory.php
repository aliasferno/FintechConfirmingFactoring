<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        $amount = $this->faker->randomFloat(2, 10000, 1000000);
        $discountRate = $this->faker->randomFloat(2, 0.5, 9.99); // Máximo 9.99% para que quepa en decimal(5,4)
        $netAmount = $amount * (1 - $discountRate / 100);
        
        return [
            'company_id' => Company::factory(),
            'invoice_number' => 'INV-' . $this->faker->unique()->numerify('######'),
            'client_name' => $this->faker->company(),
            'client_tax_id' => $this->faker->numerify('##########'),
            'amount' => $amount,
            'issue_date' => $this->faker->dateTimeBetween('-30 days', 'now'),
            'due_date' => $this->faker->dateTimeBetween('+30 days', '+180 days'),
            'status' => $this->faker->randomElement(['pending', 'approved', 'rejected', 'funded', 'expired']),
            'risk_score' => $this->faker->numberBetween(300, 850),
            'discount_rate' => $discountRate,
            'net_amount' => $netAmount,
            'verification_status' => $this->faker->randomElement(['pending', 'verified', 'rejected']),
            'operation_type' => $this->faker->randomElement(['factoring', 'confirming']),
            'description' => $this->faker->sentence(),
        ];
    }

    public function factoring(): static
    {
        return $this->state(fn (array $attributes) => [
            'operation_type' => 'factoring',
            'advance_percentage' => $this->faker->randomFloat(2, 10, 90),
            'commission_rate' => $this->faker->randomFloat(2, 0.1, 9.99), // Máximo 9.99% para que quepa en decimal(5,4)
            'expected_collection_date' => $this->faker->dateTimeBetween('+30 days', '+180 days'),
            'credit_risk_assessment' => $this->faker->randomElement(['low', 'medium', 'high']),
        ]);
    }

    public function confirming(): static
    {
        return $this->state(fn (array $attributes) => [
            'operation_type' => 'confirming',
            'supplier_name' => $this->faker->company(),
            'supplier_tax_id' => $this->faker->numerify('##########'),
            'payment_terms' => $this->faker->numberBetween(30, 180),
            'early_payment_discount' => $this->faker->randomFloat(2, 0, 9.99), // Máximo 9.99% para que quepa en decimal(5,4)
            'confirmation_deadline' => $this->faker->dateTimeBetween('+7 days', '+30 days'),
            'confirming_commission' => $this->faker->randomFloat(2, 0.5, 9.99), // Máximo 9.99% para que quepa en decimal(5,4)
            'supplier_notification' => $this->faker->boolean(),
            'advance_request' => $this->faker->boolean(),
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'verification_status' => 'verified',
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'verification_status' => 'pending',
        ]);
    }
}