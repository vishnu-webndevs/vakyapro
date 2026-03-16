<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('pre_prompts')) {
            Schema::create('pre_prompts', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->string('category')->index();
                $table->integer('sort_order')->default(0)->index();
                $table->boolean('is_active')->default(true)->index();
                $table->json('variants');
                $table->timestamps();
            });
        }

        $count = (int) DB::table('pre_prompts')->count();
        if ($count > 0) {
            return;
        }

        DB::table('pre_prompts')->insert([
            [
                'title' => 'Professional Studio Headshot',
                'category' => 'Portraits',
                'sort_order' => 1,
                'is_active' => true,
                'variants' => json_encode([
                    [
                        'prompt' => "A high-end professional corporate headshot of a person looking directly at the camera. Clean, neutral dark grey seamless paper background. Rembrandt lighting setup casting a soft triangle of light on the cheek. The subject wears sharp, formal business attire, a dark tailored suit. 85mm portrait lens, shallow depth of field, hyper-realistic, highly detailed skin texture.",
                        'image' => 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop',
                    ],
                    [
                        'prompt' => "A high-end professional corporate headshot of a person looking slightly away from the camera. Warm beige seamless paper background. Butterfly lighting setup producing a soft glow. The subject wears modern business casual attire. 85mm portrait lens, shallow depth of field, natural and approachable expression.",
                        'image' => 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop',
                    ],
                    [
                        'prompt' => "A high-end professional corporate headshot with a slight smile. Soft window light coming from the left. Clean, beautifully blurred modern office environment in the background. The subject is wearing a crisp white shirt. 50mm lens, bright and optimistic corporate portrait.",
                        'image' => 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=600&auto=format&fit=crop',
                    ],
                ], JSON_UNESCAPED_SLASHES),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Neon City Cyberpunk',
                'category' => 'Cyberpunk',
                'sort_order' => 2,
                'is_active' => true,
                'variants' => json_encode([
                    [
                        'prompt' => "A gritty, futuristic cyberpunk portrait. Vivid neon pink and cyan rim lighting illuminating the subject's face and shoulders in the dark. In the background, a heavily blurred, rainy, futuristic neon city street with glowing Asian characters and holographic signs. 8k resolution, cinematic lighting, conceptual art.",
                        'image' => 'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=600&auto=format&fit=crop',
                    ],
                    [
                        'prompt' => "A neon-drenched cyberpunk portrait with rain hitting the subject's clear illuminated face shield. Acid green and deep purple lighting. Dark, dirty alleyway with glowing neon tubes and wires hanging in the background. Masterpiece, highly detailed.",
                        'image' => 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
                    ],
                ], JSON_UNESCAPED_SLASHES),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => '3D Pixar-Style Avatar',
                'category' => 'Animated',
                'sort_order' => 3,
                'is_active' => true,
                'variants' => json_encode([
                    [
                        'prompt' => 'A highly detailed 3D cartoon portrait of a person in the style of a modern Pixar or Disney CGI animated movie. Soft, warm, magical studio lighting. The character has large, expressive eyes, smooth stylized proportions, soft skin, and highly distinct realistic textured hair. Masterpiece, unreal engine 5 render, volumetric lighting.',
                        'image' => 'https://images.unsplash.com/photo-1498334906313-6e099a1bd28d?q=80&w=600&auto=format&fit=crop',
                    ],
                    [
                        'prompt' => 'A 3D cartoon portrait of a person in modern Pixar style, stylized proportions. Holding a magical glowing orb. Cold, magical cyan light bouncing off their face. Large expressive eyes, incredibly detailed Pixar skin shading. Unreal engine 5 render, beautiful cinematic rim lighting.',
                        'image' => 'https://images.unsplash.com/photo-1514755106263-5df3f317b3d3?q=80&w=600&auto=format&fit=crop',
                    ],
                ], JSON_UNESCAPED_SLASHES),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Moody Cinematic Film Look',
                'category' => 'Cinematic',
                'sort_order' => 4,
                'is_active' => true,
                'variants' => json_encode([
                    [
                        'prompt' => 'A moody, cinematic still frame inspired by Christopher Nolan films. Teal and orange complementary color grading. Lifted black levels for a vintage film-like matte finish. Emphasized deep shadows, dramatic lighting from a single light source out of frame, subtle anamorphic lens flare, raw photo, 35mm film grain.',
                        'image' => 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?q=80&w=600&auto=format&fit=crop',
                    ],
                    [
                        'prompt' => 'Cinematic medium shot of a person looking out of a rain-streaked window at night. Low key lighting, high contrast. A glowing streetlamp casting warm golden light over their profile against deep blue shadows. 35mm lens, movie still frame, Kodak Vision3 500T film stock.',
                        'image' => 'https://images.unsplash.com/photo-1533038590840-1c793ba64524?q=80&w=600&auto=format&fit=crop',
                    ],
                ], JSON_UNESCAPED_SLASHES),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Hyper-Realistic Nature Profile',
                'category' => 'Realistic',
                'sort_order' => 5,
                'is_active' => true,
                'variants' => json_encode([
                    [
                        'prompt' => 'A hyper-realistic close-up portrait of a person outdoors. Extremely sharp focus on the eye specular highlights and skin pores. Beautiful natural sunlight. In the background, a naturally blurred green forest with a gorgeous, buttery shallow depth of field bokeh. Shot on Sony A7R IV, 50mm f/1.2.',
                        'image' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
                    ],
                    [
                        'prompt' => 'A hyper-realistic close-up portrait outdoors during golden hour. Warm back-lighting from a low sun casting a halo effect on the subject\'s hair. Perfectly sharp eye details. Blurred open field background with warm sunset colors. Shot on Canon EOS R5, 85mm f/1.2 L.',
                        'image' => 'https://images.unsplash.com/photo-1479936343636-73cdc5aae0c3?q=80&w=600&auto=format&fit=crop',
                    ],
                ], JSON_UNESCAPED_SLASHES),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'title' => 'Anime Style Transformation',
                'category' => 'Animated',
                'sort_order' => 6,
                'is_active' => true,
                'variants' => json_encode([
                    [
                        'prompt' => 'An illustration of a person in the style of a high-budget 1990s Japanese anime film. Vibrant flat cel-shaded colors, dramatic deep crisp shadows, delicate line art. Dynamic composition with stylized atmospheric background details. Makoto Shinkai style, masterwork, 4k anime wallpaper.',
                        'image' => 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop',
                    ],
                    [
                        'prompt' => 'An illustration of a person in the style of Studio Ghibli. Soft, lush watercolor backgrounds with vivid green foliage. The character outline is slightly textured and organic. Warm, nostalgic summer afternoon lighting, peaceful atmosphere, masterpiece.',
                        'image' => 'https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=600&auto=format&fit=crop',
                    ],
                ], JSON_UNESCAPED_SLASHES),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('pre_prompts');
    }
};

