<?php

namespace Database\Factories;

use App\Models\Chat;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Chat>
 */
class ChatFactory extends Factory
{
    protected $model = Chat::class;

    public function definition(): array
    {
        $customer = Customer::factory()->create();

        return [
            'customer_id' => $customer->id,
            'status' => 'open',
            'last_message_at' => now(),
            'last_message_preview' => $this->faker->sentence(),
        ];
    }
}
