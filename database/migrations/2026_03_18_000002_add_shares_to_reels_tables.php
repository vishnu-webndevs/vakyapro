<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reels', function (Blueprint $table) {
            if (! Schema::hasColumn('reels', 'shares_count')) {
                $table->unsignedBigInteger('shares_count')->default(0)->after('saves_count');
                $table->index(['is_active', 'shares_count']);
            }
        });

        if (! Schema::hasTable('reel_shares')) {
            Schema::create('reel_shares', function (Blueprint $table) {
                $table->id();
                $table->foreignId('reel_id')->constrained('reels')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->timestamp('created_at')->useCurrent();
                $table->index(['reel_id', 'created_at']);
                $table->index(['user_id', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('reel_shares')) {
            Schema::drop('reel_shares');
        }

        Schema::table('reels', function (Blueprint $table) {
            if (Schema::hasColumn('reels', 'shares_count')) {
                $table->dropColumn('shares_count');
            }
        });
    }
};

