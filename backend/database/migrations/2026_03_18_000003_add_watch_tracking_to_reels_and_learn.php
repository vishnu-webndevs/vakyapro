<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reels', function (Blueprint $table) {
            if (! Schema::hasColumn('reels', 'watch_time_ms')) {
                $table->unsignedBigInteger('watch_time_ms')->default(0)->after('views_count');
                $table->index(['is_active', 'watch_time_ms']);
            }
        });

        if (! Schema::hasTable('reel_view_events')) {
            Schema::create('reel_view_events', function (Blueprint $table) {
                $table->id();
                $table->foreignId('reel_id')->constrained('reels')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->unsignedInteger('watch_duration_ms')->default(0);
                $table->boolean('is_completed')->default(false);
                $table->timestamp('created_at')->useCurrent();
                $table->index(['reel_id', 'created_at']);
                $table->index(['user_id', 'created_at']);
            });
        }

        Schema::table('learn_videos', function (Blueprint $table) {
            if (! Schema::hasColumn('learn_videos', 'views_count')) {
                $table->unsignedBigInteger('views_count')->default(0)->after('is_active');
                $table->index(['is_active', 'views_count']);
            }
            if (! Schema::hasColumn('learn_videos', 'watch_time_ms')) {
                $table->unsignedBigInteger('watch_time_ms')->default(0)->after('views_count');
                $table->index(['is_active', 'watch_time_ms']);
            }
        });

        if (! Schema::hasTable('learn_video_view_events')) {
            Schema::create('learn_video_view_events', function (Blueprint $table) {
                $table->id();
                $table->foreignId('learn_video_id')->constrained('learn_videos')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->unsignedInteger('watch_duration_ms')->default(0);
                $table->boolean('is_completed')->default(false);
                $table->timestamp('created_at')->useCurrent();
                $table->index(['learn_video_id', 'created_at']);
                $table->index(['user_id', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('learn_video_view_events')) {
            Schema::drop('learn_video_view_events');
        }

        Schema::table('learn_videos', function (Blueprint $table) {
            if (Schema::hasColumn('learn_videos', 'watch_time_ms')) {
                $table->dropColumn('watch_time_ms');
            }
            if (Schema::hasColumn('learn_videos', 'views_count')) {
                $table->dropColumn('views_count');
            }
        });

        if (Schema::hasTable('reel_view_events')) {
            Schema::drop('reel_view_events');
        }

        Schema::table('reels', function (Blueprint $table) {
            if (Schema::hasColumn('reels', 'watch_time_ms')) {
                $table->dropColumn('watch_time_ms');
            }
        });
    }
};

