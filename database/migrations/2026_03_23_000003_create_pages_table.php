<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('content');
            $table->boolean('is_published')->default(false)->index();
            $table->timestamps();
        });

        $now = now();
        $defaults = [
            [
                'title' => 'Privacy Policy',
                'slug' => 'privacy-policy',
                'content' => '<p>We respect your privacy. Update this policy from the admin panel.</p>',
                'is_published' => true,
            ],
            [
                'title' => 'Terms & Conditions',
                'slug' => 'terms',
                'content' => '<p>Update these terms from the admin panel.</p>',
                'is_published' => true,
            ],
            [
                'title' => 'Cookies Policy',
                'slug' => 'cookies',
                'content' => '<p>Update this cookies policy from the admin panel.</p>',
                'is_published' => true,
            ],
            [
                'title' => 'About Us',
                'slug' => 'about-us',
                'content' => '<p>Tell users about your company. Update this page from the admin panel.</p>',
                'is_published' => true,
            ],
            [
                'title' => 'Contact Us',
                'slug' => 'contact-us',
                'content' => '<p>Add your contact details and form instructions here. Update this page from the admin panel.</p>',
                'is_published' => true,
            ],
        ];

        foreach ($defaults as $row) {
            DB::table('pages')->updateOrInsert(
                ['slug' => $row['slug']],
                [
                    'title' => $row['title'],
                    'content' => $row['content'],
                    'is_published' => $row['is_published'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
