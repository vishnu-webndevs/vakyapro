<?php

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

class PlanFactory extends Factory
{
    protected $model = Plan::class;

    public function definition(): array
    {
        return [
            'name' => 'Plan '.$this->faker->unique()->word(),
            'description' => $this->faker->sentence(),
            'monthly_limit' => $this->faker->numberBetween(1000, 100000),
            'price' => $this->faker->randomFloat(2, 0, 9999),
            'billing_frequency' => $this->faker->randomElement(['monthly', 'yearly']),
            'features' => ['Feature A', 'Feature B'],
            'limits' => [
                'user_count' => $this->faker->numberBetween(1, 10),
                'storage_gb' => $this->faker->numberBetween(5, 100),
            ],
            'is_active' => true,
        ];
    }
}
