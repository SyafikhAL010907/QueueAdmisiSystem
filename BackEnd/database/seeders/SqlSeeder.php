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
            
            // 1. Reset Password Admin Dev
            $affectedAdmin = DB::table('users')->whereRaw('LOWER(email) = ?', [strtolower('AdminDev@gmail.com')])->update([
                'password' => \Illuminate\Support\Facades\Hash::make('Admindev1')
            ]);
            
            // 2. Reset Password Semua Admin Loket (1-4) jadi 12345678
            $affectedLoket = DB::table('users')->where('role', 'like', 'Admin Loket %')->update([
                'password' => \Illuminate\Support\Facades\Hash::make('12345678')
            ]);

            \Illuminate\Support\Facades\Log::info("SQL Import - Password Reset Summary", [
                'admin_dev_updated' => $affectedAdmin,
                'loket_users_updated' => $affectedLoket,
                'total_users_in_db' => DB::table('users')->count()
            ]);




            $this->command->info("Impor data berhasil & Password admin di-reset!");
        } catch (\Exception $e) {

            $this->command->error("Gagal impor data: " . $e->getMessage());
        }
    }
}
