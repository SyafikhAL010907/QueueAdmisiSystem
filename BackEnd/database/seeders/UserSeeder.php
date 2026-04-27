<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Akun AdminDev
        User::create([
            'name' => 'Super Admin Dev',
            'email' => 'admindev@example.com',
            'role' => 'AdminDev',
            'password' => Hash::make('password123'), // password: password123
        ]);

        // Akun Admin
        User::create([
            'name' => 'Admin Operasional',
            'email' => 'admin@example.com',
            'role' => 'admin',
            'password' => Hash::make('password123'), // password: password123
        ]);
    }
}
