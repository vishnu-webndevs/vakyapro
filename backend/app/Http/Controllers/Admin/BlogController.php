<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use App\Services\AI\OpenAIService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Throwable;

class BlogController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->input('search', ''));
        $status = trim((string) $request->input('status', ''));
        $perPage = (int) $request->input('per_page', 20);
        if ($perPage < 1) {
            $perPage = 20;
        }
        if ($perPage > 100) {
            $perPage = 100;
        }

        $query = Blog::query()
            ->with(['category:id,name,slug'])
            ->orderByDesc('created_at');

        if ($status === 'published') {
            $query->where('is_published', true);
        } elseif ($status === 'draft') {
            $query->where('is_published', false);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%'.$search.'%')
                    ->orWhere('slug', 'like', '%'.$search.'%');
            });
        }

        $blogs = $query->paginate($perPage);
        $blogs->through(function (Blog $blog) {
            return [
                'id' => $blog->id,
                'title' => $blog->title,
                'slug' => $blog->slug,
                'excerpt' => $blog->excerpt(),
                'featured_image' => $blog->featured_image,
                'is_published' => (bool) $blog->is_published,
                'category' => $blog->category ? [
                    'id' => $blog->category->id,
                    'name' => $blog->category->name,
                    'slug' => $blog->category->slug,
                ] : null,
                'created_at' => optional($blog->created_at)->toIso8601String(),
                'updated_at' => optional($blog->updated_at)->toIso8601String(),
            ];
        });

        return response()->json($blogs);
    }

    public function show(Blog $blog)
    {
        $blog->load(['category:id,name,slug']);

        return response()->json([
            'id' => $blog->id,
            'title' => $blog->title,
            'slug' => $blog->slug,
            'content' => $blog->content,
            'category_id' => $blog->category_id,
            'featured_image' => $blog->featured_image,
            'is_published' => (bool) $blog->is_published,
            'category' => $blog->category ? [
                'id' => $blog->category->id,
                'name' => $blog->category->name,
                'slug' => $blog->category->slug,
            ] : null,
            'created_at' => optional($blog->created_at)->toIso8601String(),
            'updated_at' => optional($blog->updated_at)->toIso8601String(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('blogs', 'slug')],
            'content' => ['required', 'string'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'featured_image' => ['nullable', 'string', 'max:2048'],
            'is_published' => ['boolean'],
        ]);

        $blog = new Blog();
        $blog->title = $data['title'];
        if (is_string($data['slug'] ?? null) && trim((string) $data['slug']) !== '') {
            $blog->slug = trim((string) $data['slug']);
        }
        $blog->content = $data['content'];
        $blog->category_id = (int) $data['category_id'];
        $blog->featured_image = $data['featured_image'] ?? null;
        $blog->is_published = (bool) ($data['is_published'] ?? false);
        $blog->save();

        return response()->json($blog, 201);
    }

    public function update(Request $request, Blog $blog)
    {
        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:255', Rule::unique('blogs', 'slug')->ignore($blog->id)],
            'content' => ['sometimes', 'required', 'string'],
            'category_id' => ['sometimes', 'required', 'integer', 'exists:categories,id'],
            'featured_image' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'is_published' => ['sometimes', 'boolean'],
        ]);

        foreach (['title', 'content', 'featured_image'] as $field) {
            if (array_key_exists($field, $data)) {
                $blog->{$field} = $data[$field];
            }
        }

        if (array_key_exists('slug', $data)) {
            $slug = $data['slug'];
            $blog->slug = is_string($slug) && trim($slug) !== '' ? trim($slug) : null;
        }

        if (array_key_exists('category_id', $data)) {
            $blog->category_id = (int) $data['category_id'];
        }

        if (array_key_exists('is_published', $data)) {
            $blog->is_published = (bool) $data['is_published'];
        }

        $blog->save();

        return response()->json($blog);
    }

    public function destroy(Blog $blog)
    {
        $blog->delete();

        return response()->json(['success' => true]);
    }

    public function generateContent(Request $request, OpenAIService $ai)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
        ]);

        try {
            $html = $ai->generateSeoBlogHtml($data['title']);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (Throwable $e) {
            return response()->json(['message' => 'AI content generation failed.'], 500);
        }

        return response()->json([
            'content' => $html,
        ]);
    }
}
