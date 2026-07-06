<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Reel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ReelController extends Controller
{
    public function index(Request $request)
    {
        $includeInactive = filter_var($request->input('include_inactive', true), FILTER_VALIDATE_BOOLEAN);
        $search = trim((string) $request->input('search', ''));

        $query = Reel::query();

        if (! $includeInactive) {
            $query->where('is_active', true);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%'.$search.'%')
                    ->orWhere('description', 'like', '%'.$search.'%')
                    ->orWhere('prompt', 'like', '%'.$search.'%');
            });
        }

        $items = $query
            ->orderBy('order')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'prompt' => ['nullable', 'string'],
            'video_url' => ['nullable', 'string', 'max:500'],
            'video_file' => ['nullable', 'file', 'mimetypes:video/mp4,video/webm,video/quicktime', 'max:512000'],
            'thumbnail_url' => ['nullable', 'string', 'max:500'],
            'order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (empty($data['video_url']) && ! $request->hasFile('video_file')) {
            return response()->json([
                'message' => 'Either video_url or video_file is required.',
                'errors' => [
                    'video_url' => ['Either video_url or video_file is required.'],
                ],
            ], 422);
        }

        $reel = Reel::create([
            'created_by' => Auth::guard('admin')->id(),
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'prompt' => $data['prompt'] ?? null,
            'video_url' => $data['video_url'] ?? null,
            'thumbnail_url' => $data['thumbnail_url'] ?? null,
            'order' => (int) ($data['order'] ?? 0),
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);

        if ($request->hasFile('video_file')) {
            $reel = $this->storeReelVideoFile($request, $reel, $request->file('video_file'));
        }

        return response()->json([
            'data' => $reel,
        ], 201);
    }

    public function update(Request $request, Reel $reel)
    {
        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'prompt' => ['sometimes', 'nullable', 'string'],
            'video_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'video_file' => ['nullable', 'file', 'mimetypes:video/mp4,video/webm,video/quicktime', 'max:512000'],
            'thumbnail_url' => ['sometimes', 'nullable', 'string', 'max:500'],
            'order' => ['sometimes', 'nullable', 'integer'],
            'is_active' => ['sometimes', 'nullable', 'boolean'],
        ]);

        foreach (['title', 'description', 'prompt', 'video_url', 'thumbnail_url'] as $field) {
            if (array_key_exists($field, $data)) {
                $reel->{$field} = $data[$field] === '' ? null : $data[$field];
            }
        }

        if (array_key_exists('order', $data)) {
            $reel->order = (int) ($data['order'] ?? 0);
        }

        if (array_key_exists('is_active', $data)) {
            $reel->is_active = (bool) ($data['is_active'] ?? false);
        }

        $reel->save();

        if ($request->hasFile('video_file')) {
            $reel = $this->storeReelVideoFile($request, $reel, $request->file('video_file'));
        }

        return response()->json([
            'data' => $reel,
        ]);
    }

    public function destroy(Reel $reel)
    {
        $reel->is_active = false;
        $reel->save();

        return response()->json(['message' => 'Deleted']);
    }

    protected function storeReelVideoFile(Request $request, Reel $reel, $file): Reel
    {
        $extension = $file->getClientOriginalExtension() ?: 'mp4';
        $relativePath = 'reels/'.$reel->id.'/video.'.$extension;

        Storage::disk('public')->putFileAs('reels/'.$reel->id, $file, 'video.'.$extension);

        $reel->video_path = $relativePath;
        $reel->video_url = rtrim($request->getSchemeAndHttpHost(), '/').'/storage/'.ltrim($relativePath, '/');
        $reel->save();

        return $reel;
    }
}

