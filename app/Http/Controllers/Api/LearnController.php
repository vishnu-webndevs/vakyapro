<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LearnVideo;
use Illuminate\Http\Request;

class LearnController extends Controller
{
    public function index(Request $request)
    {
        $items = LearnVideo::query()
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
            ]);

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }
}

