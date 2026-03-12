<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Admin;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $adminEmail = env('SEED_ADMIN_EMAIL', 'admin@vakyapro.test');
        $adminPassword = env('SEED_ADMIN_PASSWORD', 'Admin@123');

        Admin::updateOrCreate(
            ['email' => $adminEmail],
            [
                'name' => env('SEED_ADMIN_NAME', 'Super Admin'),
                'password' => Hash::make($adminPassword),
                'role' => env('SEED_ADMIN_ROLE', 'super_admin'),
            ]
        );

        $userEmail = env('SEED_USER_EMAIL', 'user@vakyapro.test');
        $userPassword = env('SEED_USER_PASSWORD', 'User@123');

        User::updateOrCreate(
            ['email' => $userEmail],
            [
                'name' => env('SEED_USER_NAME', 'Demo User'),
                'password' => Hash::make($userPassword),
            ]
        );
    }
}
