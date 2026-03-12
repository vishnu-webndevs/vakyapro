<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AI\OpenAIService;
use Illuminate\Http\Request;

class PromptController extends Controller
{
    protected $aiService;

    public function __construct(OpenAIService $aiService)
    {
        $this->aiService = $aiService;
    }

    public function generate(Request $request)
    {
        $request->validate([
            'prompt' => 'required|string',
            'history' => 'nullable|array',
            'question_count' => 'nullable|integer',
        ]);

        try {
            $options = [
                'history' => $request->input('history', []),
                'question_count' => $request->input('question_count', 0),
            ];

            $result = $this->aiService->generate($request->input('prompt'), $options);

            // Save to history if user is authenticated
            if ($request->user()) {
                $request->user()->prompts()->create([
                    'original_prompt' => $request->input('prompt'),
                    'refined_prompt' => $result,
                    'options' => $options,
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function index(Request $request)
    {
        // Fetch prompts history for the authenticated user
        $prompts = $request->user()->prompts()
            ->latest()
            ->select(['id', 'original_prompt', 'refined_prompt', 'created_at'])
            ->paginate(20);

        return response()->json($prompts);
    }
}
