<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('queues', function (Blueprint $table) {
        $table->id();
        $table->string('queue_number');
        $table->string('name');
        $table->enum('status', ['waiting', 'called', 'completed', 'canceled'])
              ->default('waiting');
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('queues');
    }
};
