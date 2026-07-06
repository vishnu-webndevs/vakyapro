<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrePrompt;
use Illuminate\Http\Request;

class PrePromptController extends Controller
{
    public function index(Request $request)
    {
        $category = trim((string) $request->input('category', ''));

        $query = PrePrompt::query()
            ->where('is_active', true);

        if ($category !== '') {
            $query->where('category', $category);
        }

        $items = $query
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'title', 'category', 'sort_order', 'variants']);

        return response()->json([
            'data' => $items,
        ]);
    }

    public function categories(Request $request)
    {
        $rows = PrePrompt::query()
            ->where('is_active', true)
            ->selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->orderBy('category')
            ->get();

        $data = $rows->map(fn ($r) => [
            'name' => (string) $r->category,
            'count' => (int) $r->count,
        ]);

        return response()->json(['data' => $data]);
    }
}
