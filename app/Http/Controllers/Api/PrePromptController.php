<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrePrompt;
use Illuminate\Http\Request;

class PrePromptController extends Controller
{
    public function index(Request $request)
    {
        $items = PrePrompt::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'title', 'category', 'sort_order', 'variants']);

        return response()->json([
            'data' => $items,
        ]);
    }
}

