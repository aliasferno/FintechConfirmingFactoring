<?php

namespace Database\Factories;

use App\Models\Investment;
use App\Models\User;
use App\Models\Invoice;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Investment>
 */
class InvestmentFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Investment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $amount = $this->faker->randomFloat(2, 5000, 100000);
        $returnRate = $this->faker->randomFloat(4, 0.05, 0.15); // 5% to 15%
        $expectedReturn = $amount * $returnRate;
        
        $investmentDate = $this->faker->dateTimeBetween('-6 months', 'now');
        $maturityDate = (clone $investmentDate)->modify('+' . $this->faker->numberBetween(30, 180) . ' days');

        return [
            'user_id' => User::factory(),
            'invoice_id' => Invoice::factory(),
            'amount' => $amount,
            'expected_return' => $expectedReturn,
            'actual_return' => null,
            'investment_date' => $investmentDate,
            'maturity_date' => $maturityDate,
            'status' => Investment::STATUS_ACTIVE,
            'return_rate' => $returnRate,
        ];
    }

    /**
     * Indicate that the investment is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Investment::STATUS_ACTIVE,
            'actual_return' => null,
        ]);
    }

    /**
     * Indicate that the investment is completed.
     */
    public function completed(): static
    {
        return $this->state(function (array $attributes) {
            $expectedReturn = $attributes['expected_return'];
            $actualReturn = $this->faker->randomFloat(2, $expectedReturn * 0.8, $expectedReturn * 1.1);
            
            return [
                'status' => Investment::STATUS_COMPLETED,
                'actual_return' => $actualReturn,
            ];
        });
    }

    /**
     * Indicate that the investment is defaulted.
     */
    public function defaulted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Investment::STATUS_DEFAULTED,
            'actual_return' => 0,
        ]);
    }

    /**
     * Indicate that the investment is cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Investment::STATUS_CANCELLED,
            'actual_return' => null,
        ]);
    }

    /**
     * Create investment with specific amount range.
     */
    public function withAmount(float $min, float $max): static
    {
        return $this->state(function (array $attributes) use ($min, $max) {
            $amount = $this->faker->randomFloat(2, $min, $max);
            $returnRate = $attributes['return_rate'];
            
            return [
                'amount' => $amount,
                'expected_return' => $amount * $returnRate,
            ];
        });
    }

    /**
     * Create investment with specific return rate.
     */
    public function withReturnRate(float $rate): static
    {
        return $this->state(function (array $attributes) use ($rate) {
            $amount = $attributes['amount'];
            
            return [
                'return_rate' => $rate,
                'expected_return' => $amount * $rate,
            ];
        });
    }
}