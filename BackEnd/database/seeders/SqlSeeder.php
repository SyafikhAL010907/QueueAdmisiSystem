<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class SqlSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $path = base_path('DATA/queing_system.sql');
        
        if (!File::exists($path)) {
            $this->command->error("File SQL tidak ditemukan di: {$path}");
            return;
        }

        $this->command->info("Mengimpor data dari {$path}...");
        
        // Read the SQL file
        $sql = File::get($path);
        
        // Execute the SQL queries
        try {
            DB::unprepared($sql);
            
            // 1. Pastikan Admin Dev ADA dan Passwordnya Admindev1
            DB::table('users')->updateOrInsert(
                ['email' => 'AdminDev@gmail.com'],
                [
                    'name' => 'Super Admin Dev',
                    'role' => 'Admin Dev',
                    'password' => \Illuminate\Support\Facades\Hash::make('Admindev1'),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
            
            // 2. Reset Password Semua Admin Loket (1-4) jadi 12345678
            $affectedLoket = DB::table('users')->where('role', 'like', 'Admin Loket %')->update([
                'password' => \Illuminate\Support\Facades\Hash::make('12345678')
            ]);

            \Illuminate\Support\Facades\Log::info("SQL Import - Indestructible Sync DONE", [
                'total_users_in_db' => DB::table('users')->count(),
                'loket_users_updated' => $affectedLoket
            ]);





            $this->command->info("Impor data berhasil & Password admin di-reset!");
        } catch (\Exception $e) {

            $this->command->error("Gagal impor data: " . $e->getMessage());
        }
    }
}
