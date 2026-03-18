<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->nullable()->constrained('admins');
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('prompt')->nullable();
            $table->string('video_url', 500)->nullable();
            $table->string('video_path', 500)->nullable();
            $table->string('thumbnail_url', 500)->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->integer('order')->default(0)->index();
            $table->unsignedBigInteger('views_count')->default(0);
            $table->unsignedBigInteger('likes_count')->default(0);
            $table->unsignedBigInteger('saves_count')->default(0);
            $table->unsignedBigInteger('comments_count')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'order', 'created_at']);
            $table->index(['is_active', 'likes_count']);
        });

        Schema::create('reel_likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reel_id')->constrained('reels')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['reel_id', 'user_id']);
        });

        Schema::create('reel_saves', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reel_id')->constrained('reels')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['reel_id', 'user_id']);
        });

        Schema::create('reel_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reel_id')->constrained('reels')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->boolean('is_visible')->default(true)->index();
            $table->timestamps();
            $table->index(['reel_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reel_comments');
        Schema::dropIfExists('reel_saves');
        Schema::dropIfExists('reel_likes');
        Schema::dropIfExists('reels');
    }
};

