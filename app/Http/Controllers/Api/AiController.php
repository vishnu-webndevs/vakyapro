<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AI\OpenAIService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AiController extends Controller
{
    protected OpenAIService $openai;

    public function __construct(OpenAIService $openai)
    {
        $this->openai = $openai;
    }

    public function chat(Request $request)
    {
        $data = $request->validate([
            'messages' => ['required', 'array', 'min:1'],
            'messages.*.role' => ['required', 'string', 'in:system,user,assistant'],
            'messages.*.content' => ['required', 'string'],
            'model' => ['nullable', 'string'],
            'temperature' => ['nullable', 'numeric', 'min:0', 'max:2'],
        ]);

        $result = $this->openai->chatCompletion($data['messages'], [
            'model' => $data['model'] ?? null,
            'temperature' => $data['temperature'] ?? null,
        ]);

        return response()->json($result);
    }

    public function chatStream(Request $request)
    {
        $data = $request->validate([
            'messages' => ['required', 'array', 'min:1'],
            'messages.*.role' => ['required', 'string', 'in:system,user,assistant'],
            'messages.*.content' => ['required', 'string'],
            'model' => ['nullable', 'string'],
            'temperature' => ['nullable', 'numeric', 'min:0', 'max:2'],
        ]);

        $result = $this->openai->chatCompletion($data['messages'], [
            'model' => $data['model'] ?? null,
            'temperature' => $data['temperature'] ?? null,
        ]);

        $content = (string) ($result['content'] ?? '');

        return new StreamedResponse(function () use ($content) {
            $chunks = preg_split('/(\s+)/u', $content, -1, PREG_SPLIT_DELIM_CAPTURE);
            foreach ($chunks as $chunk) {
                if ($chunk === '') {
                    continue;
                }
                echo "data: ".json_encode(['delta' => $chunk])."\n\n";
                ob_flush();
                flush();
            }
            echo "data: ".json_encode(['done' => true])."\n\n";
            ob_flush();
            flush();
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
        ]);
    }

    public function image(Request $request)
    {
        $data = $request->validate([
            'prompt' => ['required', 'string', 'max:4000'],
            'size' => ['nullable', 'string'],
        ]);

        $result = $this->openai->imageGeneration($data['prompt'], [
            'size' => $data['size'] ?? null,
        ]);

        return response()->json($result);
    }
}
