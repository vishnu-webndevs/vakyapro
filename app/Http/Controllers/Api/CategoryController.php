<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::query()
            ->withCount(['blogs as published_blogs_count' => fn ($q) => $q->where('is_published', true)])
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return response()->json($categories);
    }

    public function blogs(Request $request, string $slug)
    {
        $category = Category::query()->where('slug', $slug)->firstOrFail();

        $perPage = (int) $request->input('per_page', 10);
        if ($perPage < 1) {
            $perPage = 10;
        }
        if ($perPage > 50) {
            $perPage = 50;
        }

        $blogs = $category->blogs()
            ->with(['category:id,name,slug'])
            ->where('is_published', true)
            ->orderByDesc('created_at')
            ->paginate($perPage, ['*'], 'page');

        $blogs->through(function ($blog) {
            return [
                'id' => $blog->id,
                'title' => $blog->title,
                'slug' => $blog->slug,
                'excerpt' => $blog->excerpt(),
                'featured_image' => $blog->featured_image,
                'category' => $blog->category ? [
                    'id' => $blog->category->id,
                    'name' => $blog->category->name,
                    'slug' => $blog->category->slug,
                ] : null,
                'created_at' => optional($blog->created_at)->toIso8601String(),
            ];
        });

        return response()->json([
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
            ],
            'blogs' => $blogs,
        ]);
    }
}

