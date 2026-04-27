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
            
            // PAKSA UPDATE PASSWORD ADMIN BIAR PASTI BISA LOGIN (Huruf gede kecil aman)
            DB::table('users')->whereRaw('LOWER(email) = ?', [strtolower('AdminDev@gmail.com')])->update([
                'password' => \Illuminate\Support\Facades\Hash::make('Admindev1')
            ]);


            $this->command->info("Impor data berhasil & Password admin di-reset!");
        } catch (\Exception $e) {

            $this->command->error("Gagal impor data: " . $e->getMessage());
        }
    }
}
