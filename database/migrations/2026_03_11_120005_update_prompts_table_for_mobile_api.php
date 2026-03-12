<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('prompts')) {
            return;
        }

        Schema::table('prompts', function (Blueprint $table) {
            if (Schema::hasColumn('prompts', 'original_idea') && ! Schema::hasColumn('prompts', 'original_prompt')) {
                $table->renameColumn('original_idea', 'original_prompt');
            }

            if (! Schema::hasColumn('prompts', 'options')) {
                $table->json('options')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('prompts')) {
            return;
        }

        Schema::table('prompts', function (Blueprint $table) {
            if (Schema::hasColumn('prompts', 'original_prompt') && ! Schema::hasColumn('prompts', 'original_idea')) {
                $table->renameColumn('original_prompt', 'original_idea');
            }

            if (Schema::hasColumn('prompts', 'options')) {
                $table->dropColumn('options');
            }
        });
    }
};
