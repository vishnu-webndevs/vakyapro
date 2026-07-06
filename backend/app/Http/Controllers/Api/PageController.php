<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Page;

class PageController extends Controller
{
    public function show(string $slug)
    {
        $page = Page::query()
            ->where('is_published', true)
            ->where('slug', $slug)
            ->firstOrFail();

        return response()->json([
            'id' => $page->id,
            'title' => $page->title,
            'slug' => $page->slug,
            'content' => $page->content,
            'created_at' => optional($page->created_at)->toIso8601String(),
            'updated_at' => optional($page->updated_at)->toIso8601String(),
        ]);
    }
}

