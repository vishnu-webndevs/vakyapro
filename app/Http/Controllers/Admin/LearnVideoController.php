<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LearnVideo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class LearnVideoController extends Controller
{
    public function index(Request $request)
    {
        $includeInactive = filter_var($request->input('include_inactive', true), FILTER_VALIDATE_BOOLEAN);
        $search = trim((string) $request->input('search', ''));

        $query = LearnVideo::query();

        if (! $includeInactive) {
            $query->where('is_active', true);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%'.$search.'%')
                    ->orWhere('description', 'like', '%'.$search.'%')
                    ->orWhere('category', 'like', '%'.$search.'%');
            });
        }

        $items = $query
            ->orderBy('sort_order')
            ->orderBy('id')
            ->paginate(20);

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'category' => ['required', 'string', 'max:50'],
            'video_url' => ['required', 'string', 'max:500'],
            'thumbnail_url' => ['nullable', 'string', 'max:500'],
            'duration' => ['nullable', 'string', 'max:20'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $item = LearnVideo::create([
            'title' => $data['title'],
            'description' => $data['description'],
            'category' => $data['category'],
            'video_url' => $data['video_url'],
            'thumbnail_url' => $data['thumbnail_url'] ?? null,
            'duration' => $data['duration'] ?? null,
            'sort_order' => (int) ($data['sort_order'] ?? 0),
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);

        Cache::forever('learn_videos:version', (int) Cache::get('learn_videos:version', 1) + 1);

        return response()->json(['data' => $item], 201);
    }

    public function show(LearnVideo $learnVideo)
    {
        return response()->json(['data' => $learnVideo]);
    }

    public function update(Request $request, LearnVideo $learnVideo)
    {
        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'required', 'string'],
            'category' => ['sometimes', 'required', 'string', 'max:50'],
            'video_url' => ['sometimes', 'required', 'string', 'max:500'],
            'thumbnail_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'duration' => ['sometimes', 'nullable', 'string', 'max:20'],
            'sort_order' => ['sometimes', 'nullable', 'integer'],
            'is_active' => ['sometimes', 'nullable', 'boolean'],
        ]);

        foreach (['title', 'description', 'category', 'video_url', 'thumbnail_url', 'duration'] as $field) {
            if (array_key_exists($field, $data)) {
                $learnVideo->{$field} = $data[$field] === '' ? null : $data[$field];
            }
        }

        if (array_key_exists('sort_order', $data)) {
            $learnVideo->sort_order = (int) ($data['sort_order'] ?? 0);
        }

        if (array_key_exists('is_active', $data)) {
            $learnVideo->is_active = (bool) ($data['is_active'] ?? false);
        }

        $learnVideo->save();

        Cache::forever('learn_videos:version', (int) Cache::get('learn_videos:version', 1) + 1);

        return response()->json(['data' => $learnVideo]);
    }

    public function destroy(LearnVideo $learnVideo)
    {
        $learnVideo->is_active = false;
        $learnVideo->save();

        Cache::forever('learn_videos:version', (int) Cache::get('learn_videos:version', 1) + 1);

        return response()->json(['message' => 'Deleted']);
    }
}
