<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('service_api_keys', function (Blueprint $table) {
            $table->id();
            $table->string('provider')->unique();
            $table->text('key_encrypted');
            $table->string('last_four', 4)->nullable();
            $table->unsignedBigInteger('created_by_admin_id')->nullable();
            $table->unsignedBigInteger('updated_by_admin_id')->nullable();
            $table->timestamps();
        });

        Schema::create('service_api_key_backups', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('service_api_key_id');
            $table->text('key_encrypted');
            $table->string('last_four', 4)->nullable();
            $table->unsignedBigInteger('rotated_by_admin_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_api_key_backups');
        Schema::dropIfExists('service_api_keys');
    }
};

