<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('email')->nullable()->index();
            $table->string('external_id')->nullable()->index();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('chats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('open')->index();
            $table->timestamp('last_message_at')->nullable()->index();
            $table->string('last_message_preview', 200)->nullable();
            $table->timestamps();
        });

        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_id')->constrained()->cascadeOnDelete();
            $table->enum('sender_type', ['customer', 'admin']);
            $table->unsignedBigInteger('sender_id')->nullable()->index();
            $table->text('body');
            $table->boolean('impersonated')->default(false);
            $table->timestamp('sent_at')->useCurrent();
            $table->timestamps();
        });

        Schema::create('admin_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained()->cascadeOnDelete();
            $table->string('action');
            $table->string('resource_type')->nullable();
            $table->unsignedBigInteger('resource_id')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_activities');
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chats');
        Schema::dropIfExists('customers');
    }
};
