<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     * Mengubah kolom 'role' dari ENUM ke VARCHAR(50)
     * agar bisa menampung role loket berapapun secara dinamis.
     */
    public function up(): void
    {
        // Gunakan raw SQL agar bisa mengubah ENUM → VARCHAR tanpa konflik Blueprint
        DB::statement("ALTER TABLE `users` MODIFY `role` VARCHAR(50) NOT NULL DEFAULT 'Admin Dev'");
    }

    /**
     * Reverse the migrations.
     * Kembalikan ke ENUM (4 loket saja) jika perlu rollback
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE `users` MODIFY `role` ENUM('Admin Dev','Admin Loket 1','Admin Loket 2','Admin Loket 3','Admin Loket 4') NOT NULL DEFAULT 'Admin Dev'");
    }
};
