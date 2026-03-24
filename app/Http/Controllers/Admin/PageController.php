<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Services\AI\OpenAIService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Throwable;

class PageController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->input('search', ''));
        $status = trim((string) $request->input('status', ''));
        $perPage = (int) $request->input('per_page', 50);
        if ($perPage < 1) {
            $perPage = 50;
        }
        if ($perPage > 100) {
            $perPage = 100;
        }

        $query = Page::query()->orderBy('title');

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

        return response()->json($query->paginate($perPage));
    }

    public function show(Page $page)
    {
        return response()->json($page);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('pages', 'slug')],
            'content' => ['required', 'string'],
            'is_published' => ['boolean'],
        ]);

        $page = new Page();
        $page->title = $data['title'];
        if (is_string($data['slug'] ?? null) && trim((string) $data['slug']) !== '') {
            $page->slug = trim((string) $data['slug']);
        }
        $page->content = $data['content'];
        $page->is_published = (bool) ($data['is_published'] ?? false);
        $page->save();

        return response()->json($page, 201);
    }

    public function update(Request $request, Page $page)
    {
        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:255', Rule::unique('pages', 'slug')->ignore($page->id)],
            'content' => ['sometimes', 'required', 'string'],
            'is_published' => ['sometimes', 'boolean'],
        ]);

        foreach (['title', 'content'] as $field) {
            if (array_key_exists($field, $data)) {
                $page->{$field} = $data[$field];
            }
        }

        if (array_key_exists('slug', $data)) {
            $slug = $data['slug'];
            $page->slug = is_string($slug) && trim($slug) !== '' ? trim($slug) : null;
        }

        if (array_key_exists('is_published', $data)) {
            $page->is_published = (bool) $data['is_published'];
        }

        $page->save();

        return response()->json($page);
    }

    public function destroy(Page $page)
    {
        $page->delete();

        return response()->json(['success' => true]);
    }

    public function generateContent(Request $request, OpenAIService $ai)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
        ]);

        $slug = is_string($data['slug'] ?? null) ? trim((string) $data['slug']) : '';
        try {
            $html = $ai->generatePolicyHtml($data['title'], $slug);
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
