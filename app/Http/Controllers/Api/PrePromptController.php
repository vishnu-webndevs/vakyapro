<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrePrompt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class PrePromptController extends Controller
{
    public function index(Request $request)
    {
        $version = (int) Cache::get('pre_prompts:version', 1);
        $cacheKey = 'pre_prompts:index:'.$version;

        $items = Cache::remember($cacheKey, now()->addSeconds(300), function () {
            return PrePrompt::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get(['id', 'title', 'category', 'sort_order', 'variants']);
        });

        return response()
            ->json(['data' => $items])
            ->header('Cache-Control', 'private, max-age=300');
    }
}
