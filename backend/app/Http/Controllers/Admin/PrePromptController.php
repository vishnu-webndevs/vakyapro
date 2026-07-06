<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PrePrompt;
use Illuminate\Http\Request;

class PrePromptController extends Controller
{
    public function index(Request $request)
    {
        $includeInactive = filter_var($request->input('include_inactive', true), FILTER_VALIDATE_BOOLEAN);
        $search = trim((string) $request->input('search', ''));

        $query = PrePrompt::query();

        if (! $includeInactive) {
            $query->where('is_active', true);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', '%'.$search.'%')
                    ->orWhere('category', 'like', '%'.$search.'%');
            });
        }

        $items = $query
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'data' => $items,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'boolean'],
            'variants' => ['required', 'array', 'min:1'],
            'variants.*.prompt' => ['required', 'string', 'max:6000'],
            'variants.*.image' => ['nullable', 'string', 'max:2048'],
        ]);

        $item = PrePrompt::create([
            'title' => $data['title'],
            'category' => $data['category'],
            'sort_order' => (int) ($data['sort_order'] ?? 0),
            'is_active' => (bool) ($data['is_active'] ?? true),
            'variants' => array_values($data['variants']),
        ]);

        return response()->json([
            'data' => $item,
        ], 201);
    }

    public function show(PrePrompt $prePrompt)
    {
        return response()->json([
            'data' => $prePrompt,
        ]);
    }

    public function update(Request $request, PrePrompt $prePrompt)
    {
        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'category' => ['sometimes', 'required', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'nullable', 'integer'],
            'is_active' => ['sometimes', 'nullable', 'boolean'],
            'variants' => ['sometimes', 'required', 'array', 'min:1'],
            'variants.*.prompt' => ['required_with:variants', 'string', 'max:6000'],
            'variants.*.image' => ['nullable', 'string', 'max:2048'],
        ]);

        if (array_key_exists('title', $data)) {
            $prePrompt->title = $data['title'];
        }
        if (array_key_exists('category', $data)) {
            $prePrompt->category = $data['category'];
        }
        if (array_key_exists('sort_order', $data)) {
            $prePrompt->sort_order = (int) ($data['sort_order'] ?? 0);
        }
        if (array_key_exists('is_active', $data)) {
            $prePrompt->is_active = (bool) ($data['is_active'] ?? false);
        }
        if (array_key_exists('variants', $data)) {
            $prePrompt->variants = array_values($data['variants']);
        }

        $prePrompt->save();

        return response()->json([
            'data' => $prePrompt,
        ]);
    }

    public function destroy(PrePrompt $prePrompt)
    {
        $prePrompt->delete();

        return response()->json(['message' => 'Deleted']);
    }
}

