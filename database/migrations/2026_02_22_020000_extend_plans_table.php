<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->text('description')->nullable()->after('name');
            $table->string('billing_frequency')->default('monthly')->after('price');
            $table->json('features')->nullable()->after('billing_frequency');
            $table->json('limits')->nullable()->after('features');
            $table->boolean('is_active')->default(true)->index()->after('limits');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn(['description', 'billing_frequency', 'features', 'limits', 'is_active']);
        });
    }
};

