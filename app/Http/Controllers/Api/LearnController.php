<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LearnVideo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class LearnController extends Controller
{
    public function index(Request $request)
    {
        $version = (int) Cache::get('learn_videos:version', 1);
        $cacheKey = 'learn:index:'.$version;

        $items = Cache::remember($cacheKey, now()->addSeconds(300), function () {
            return LearnVideo::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get([
                    'id',
                    'title',
                    'description',
                    'category',
                    'video_url',
                    'thumbnail_url',
                    'duration',
                    'sort_order',
                    'is_active',
                    'views_count',
                ]);
        });

        return response()
            ->json([
                'success' => true,
                'data' => $items,
            ])
            ->header('Cache-Control', 'private, max-age=300');
    }
}
