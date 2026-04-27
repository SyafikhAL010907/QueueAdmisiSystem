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
            'email' => 'AdminDev@gmail.com',
            'role' => 'admin',
            'password' => Hash::make('Admindev1'),
        ]);

        // Akun Admin Loket
        User::create([
            'name' => 'Admin Loket 1',
            'email' => 'AdminLoket1@gmail.com',
            'role' => 'admin',
            'password' => Hash::make('12345678'),
        ]);

    }
}
