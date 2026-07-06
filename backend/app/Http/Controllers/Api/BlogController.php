<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use Illuminate\Http\Request;

class BlogController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        if ($perPage < 1) {
            $perPage = 10;
        }
        if ($perPage > 50) {
            $perPage = 50;
        }

        $blogs = Blog::query()
            ->with(['category:id,name,slug'])
            ->where('is_published', true)
            ->orderByDesc('created_at')
            ->paginate($perPage, ['*'], 'page');

        $blogs->through(function (Blog $blog) {
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

        return response()->json($blogs);
    }

    public function show(string $slug)
    {
        $blog = Blog::query()
            ->with(['category:id,name,slug'])
            ->where('is_published', true)
            ->where('slug', $slug)
            ->firstOrFail();

        return response()->json([
            'id' => $blog->id,
            'title' => $blog->title,
            'slug' => $blog->slug,
            'content' => $blog->content,
            'featured_image' => $blog->featured_image,
            'category' => $blog->category ? [
                'id' => $blog->category->id,
                'name' => $blog->category->name,
                'slug' => $blog->category->slug,
            ] : null,
            'created_at' => optional($blog->created_at)->toIso8601String(),
        ]);
    }
}

