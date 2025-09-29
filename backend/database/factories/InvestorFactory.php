<?php

namespace Database\Factories;

use App\Models\Investor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Investor>
 */
class InvestorFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Investor::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $investorTypes = [Investor::TYPE_INDIVIDUAL, Investor::TYPE_INSTITUTIONAL, Investor::TYPE_CORPORATE];
        $riskTolerances = [Investor::RISK_LOW, Investor::RISK_MEDIUM, Investor::RISK_HIGH];
        $experiences = ['beginner', 'intermediate', 'advanced', 'expert'];
        $sectors = ['technology', 'healthcare', 'finance', 'manufacturing', 'retail', 'energy'];
        
        $investmentCapacity = $this->faker->randomFloat(2, 50000, 2000000);
        $minInvestment = $investmentCapacity * 0.01; // 1% of capacity
        $maxInvestment = $investmentCapacity * 0.2;  // 20% of capacity

        return [
            'user_id' => User::factory(),
            'investor_type' => $this->faker->randomElement($investorTypes),
            'risk_tolerance' => $this->faker->randomElement($riskTolerances),
            'investment_experience' => $this->faker->randomElement(['beginner', 'intermediate', 'advanced']),
            'investment_capacity' => $investmentCapacity,
            'preferred_sectors' => $this->faker->randomElements($sectors, $this->faker->numberBetween(1, 3)),
            'minimum_investment' => round($minInvestment, 2),
            'maximum_investment' => round($maxInvestment, 2),
            'investment_horizon' => $this->faker->randomElement(['short', 'medium', 'long']),
            'verification_status' => 'verified',
            'accredited_investor' => $this->faker->boolean(30), // 30% chance of being accredited
        ];
    }

    /**
     * Indicate that the investor is individual.
     */
    public function individual(): static
    {
        return $this->state(fn (array $attributes) => [
            'investor_type' => Investor::TYPE_INDIVIDUAL,
            'investment_capacity' => $this->faker->randomFloat(2, 10000, 500000),
            'accredited_investor' => $this->faker->boolean(20), // Lower chance for individuals
        ]);
    }

    /**
     * Indicate that the investor is institutional.
     */
    public function institutional(): static
    {
        return $this->state(fn (array $attributes) => [
            'investor_type' => Investor::TYPE_INSTITUTIONAL,
            'investment_capacity' => $this->faker->randomFloat(2, 500000, 10000000),
            'accredited_investor' => true, // Institutions are typically accredited
            'risk_tolerance' => $this->faker->randomElement([Investor::RISK_MEDIUM, Investor::RISK_HIGH]),
        ]);
    }

    /**
     * Indicate that the investor is corporate.
     */
    public function corporate(): static
    {
        return $this->state(fn (array $attributes) => [
            'investor_type' => Investor::TYPE_CORPORATE,
            'investment_capacity' => $this->faker->randomFloat(2, 100000, 2000000),
            'accredited_investor' => $this->faker->boolean(70), // High chance for corporates
        ]);
    }

    /**
     * Indicate that the investor has low risk tolerance.
     */
    public function lowRisk(): static
    {
        return $this->state(fn (array $attributes) => [
            'risk_tolerance' => Investor::RISK_LOW,
        ]);
    }

    /**
     * Indicate that the investor has medium risk tolerance.
     */
    public function mediumRisk(): static
    {
        return $this->state(fn (array $attributes) => [
            'risk_tolerance' => Investor::RISK_MEDIUM,
        ]);
    }

    /**
     * Indicate that the investor has high risk tolerance.
     */
    public function highRisk(): static
    {
        return $this->state(fn (array $attributes) => [
            'risk_tolerance' => Investor::RISK_HIGH,
        ]);
    }

    /**
     * Indicate that the investor is verified.
     */
    public function verified(): static
    {
        return $this->state(fn (array $attributes) => [
            'verification_status' => 'verified',
        ]);
    }

    /**
     * Indicate that the investor is pending verification.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'verification_status' => 'pending',
        ]);
    }

    /**
     * Indicate that the investor is an accredited investor.
     */
    public function accredited(): static
    {
        return $this->state(fn (array $attributes) => [
            'accredited_investor' => true,
            'investment_capacity' => $this->faker->randomFloat(2, 1000000, 10000000),
        ]);
    }
}