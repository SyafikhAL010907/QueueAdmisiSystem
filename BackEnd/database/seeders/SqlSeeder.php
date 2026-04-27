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
            \Illuminate\Support\Facades\Log::error("SQL File NOT FOUND at: " . $path);
            return;
        }

        $sql = File::get($path);
        
        // Bersihkan SQL (Hapus komentar dan baris kosong)
        $lines = explode("\n", $sql);
        $cleanSql = "";
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line && !str_starts_with($line, '--') && !str_starts_with($line, '/*')) {
                $cleanSql .= $line . "\n";
            }
        }

        // Jalankan SQL (Pecah per statement ;)
        $statements = array_filter(array_map('trim', explode(';', $cleanSql)));
        
        $successCount = 0;
        foreach ($statements as $statement) {
            try {
                // Jangan jalankan CREATE TABLE kalau sudah ada (fresh migration sudah bikin)
                if (stripos($statement, 'CREATE TABLE') === false) {
                    DB::unprepared($statement);
                    $successCount++;
                }
            } catch (\Exception $e) {
                // Abaikan error kalau cuma masalah tabel sudah ada
            }
        }

        // PAKSA BIKIN ADMIN DEV (Kunci Utama)
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

        \Illuminate\Support\Facades\Log::info("SQL Import - FINAL REPORT", [
            'statements_executed' => $successCount,
            'total_users' => DB::table('users')->count()
        ]);
    }
}
