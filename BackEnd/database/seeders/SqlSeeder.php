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
        // Note: Using DB::unprepared for raw SQL import
        try {
            DB::unprepared($sql);
            $this->command->info("Impor data berhasil!");
        } catch (\Exception $e) {
            $this->command->error("Gagal impor data: " . $e->getMessage());
        }
    }
}
