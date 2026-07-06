<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AI\OpenAIService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class AiController extends Controller
{
    protected OpenAIService $openai;

    public function __construct(OpenAIService $openai)
    {
        $this->openai = $openai;
    }

    protected function findLastUserMessage(array $messages): ?array
    {
        for ($i = count($messages) - 1; $i >= 0; $i--) {
            $m = $messages[$i] ?? null;
            if (is_array($m) && ($m['role'] ?? null) === 'user') {
                return $m;
            }
        }

        return null;
    }

    protected function hasImageInContent($content): bool
    {
        if (is_array($content)) {
            foreach ($content as $part) {
                if (is_array($part) && ($part['type'] ?? '') === 'image_url') {
                    return true;
                }
            }
        }

        if (is_string($content) && (str_contains($content, 'data:image/') || str_contains($content, 'http'))) {
            return true;
        }

        return false;
    }

    protected function findLastUserContent(array $messages): string
    {
        for ($i = count($messages) - 1; $i >= 0; $i--) {
            $m = $messages[$i] ?? null;
            if (! is_array($m)) {
                continue;
            }
            if (($m['role'] ?? null) !== 'user') {
                continue;
            }
            $content = $m['content'] ?? '';

            // Handle multi-modal content array
            if (is_array($content)) {
                $textParts = [];
                foreach ($content as $part) {
                    if (is_array($part) && ($part['type'] ?? '') === 'text') {
                        $textParts[] = $part['text'] ?? '';
                    }
                }
                $content = implode(' ', $textParts);
            }

            if (! is_string($content)) {
                continue;
            }
            $content = trim($content);
            if ($content !== '') {
                return $content;
            }
        }

        return '';
    }

    protected function looksLikeUploadOrAttachment(string $text): bool
    {
        $t = mb_strtolower($text);
        $keywords = [
            'pdf',
            '.pdf',
            'doc',
            '.doc',
            '.docx',
            'document',
            'attachment',
            'attached',
            'upload',
            'uploaded',
            'file',
            'image',
            'photo',
            'picture',
            'jpg',
            'jpeg',
            'png',
            'data:image/',
            'data:application/pdf;base64',
        ];

        foreach ($keywords as $kw) {
            if (str_contains($t, $kw)) {
                return true;
            }
        }

        return false;
    }

    protected function isPromptEngineQuestion(string $content): bool
    {
        $t = trim($content);
        if ($t === '') {
            return false;
        }

        $c = mb_strtolower($t);
        $markers = [
            'theek hai.',
            'audience kaun hai',
            'style kaisa',
            'colors pasand',
            'image kis purpose',
            'main subject',
            'size/aspect ratio',
            'ye name kis cheez',
            'niche/industry',
            'name ka vibe',
            'aap kaha se kaha',
            'dates ya month',
            'travel style',
            'kis tech/framework',
            'exact error message',
            'kis step/endpoint',
            'aapko kiske liye prompt',
            'target audience kaun',
            'output ka format',
            'must-have points',
            'must-have ya restriction',
        ];

        foreach ($markers as $marker) {
            if (str_contains($c, $marker)) {
                return true;
            }
        }

        return false;
    }

    protected function inferPromptEngineQuestionCount(array $messages): int
    {
        $count = 0;
        foreach ($messages as $m) {
            if (! is_array($m)) {
                continue;
            }
            if (($m['role'] ?? null) !== 'assistant') {
                continue;
            }
            $content = $m['content'] ?? '';
            if (! is_string($content)) {
                continue;
            }
            if ($this->isPromptEngineQuestion($content)) {
                $count++;
            }
        }

        return $count;
    }

    public function chat(Request $request)
    {
        $data = $request->validate([
            'messages' => ['required', 'array', 'min:1'],
            'messages.*.role' => ['required', 'string', 'in:system,user,assistant'],
            'messages.*.content' => ['required'], // Removed 'string' to allow arrays (multi-modal)
            'model' => ['nullable', 'string'],
            'temperature' => ['nullable', 'numeric', 'min:0', 'max:2'],
        ]);

        $startedAt = microtime(true);

        $lastUserMessage = $this->findLastUserMessage($data['messages']);
        $lastUserContent = $this->findLastUserContent($data['messages']);
        $hasImage = $lastUserMessage && $this->hasImageInContent($lastUserMessage['content'] ?? '');

        if ($lastUserContent !== '' && ($hasImage || $this->looksLikeUploadOrAttachment($lastUserContent))) {
            $questionCount = $this->inferPromptEngineQuestionCount($data['messages']);

            $content = $this->openai->generate($lastUserContent, [
                'history' => $data['messages'],
                'question_count' => $questionCount,
            ]);

            return response()
                ->json([
                    'content' => $content,
                    'raw' => [
                        'source' => 'prompt_engine',
                        'question_count' => $questionCount,
                    ],
                ])
                ->header('Cache-Control', 'no-store');
        }

        try {
            $result = $this->openai->chatCompletion($data['messages'], [
                'model' => 'gpt-4o',
                'temperature' => $data['temperature'] ?? null,
            ]);
        } catch (Throwable $e) {
            Log::error('AI chat failed', [
                'user_id' => optional($request->user())->id,
                'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => $e->getMessage() ?: 'AI request failed',
            ], 503);
        }

        return response()
            ->json($result)
            ->header('Cache-Control', 'no-store');
    }

    public function chatStream(Request $request)
    {
        $data = $request->validate([
            'messages' => ['required', 'array', 'min:1'],
            'messages.*.role' => ['required', 'string', 'in:system,user,assistant'],
            'messages.*.content' => ['required'], // Removed 'string' to allow arrays (multi-modal)
            'model' => ['nullable', 'string'],
            'temperature' => ['nullable', 'numeric', 'min:0', 'max:2'],
        ]);

        $startedAt = microtime(true);

        $lastUserMessage = $this->findLastUserMessage($data['messages']);
        $lastUserContent = $this->findLastUserContent($data['messages']);
        $hasImage = $lastUserMessage && $this->hasImageInContent($lastUserMessage['content'] ?? '');

        if ($lastUserContent !== '' && ($hasImage || $this->looksLikeUploadOrAttachment($lastUserContent))) {
            $questionCount = $this->inferPromptEngineQuestionCount($data['messages']);

            $content = $this->openai->generate($lastUserContent, [
                'history' => $data['messages'],
                'question_count' => $questionCount,
            ]);

            return new StreamedResponse(function () use ($content) {
                $chunks = preg_split('/(\s+)/u', $content, -1, PREG_SPLIT_DELIM_CAPTURE);
                foreach ($chunks as $chunk) {
                    if ($chunk === '') {
                        continue;
                    }
                    echo 'data: '.json_encode(['delta' => $chunk])."\n\n";
                    ob_flush();
                    flush();
                }
                echo 'data: '.json_encode(['done' => true])."\n\n";
                ob_flush();
                flush();
            }, 200, [
                'Content-Type' => 'text/event-stream',
                'Cache-Control' => 'no-cache',
                'Connection' => 'keep-alive',
            ]);
        }

        try {
            $result = $this->openai->chatCompletion($data['messages'], [
                'model' => 'gpt-4o',
                'temperature' => $data['temperature'] ?? null,
            ]);
        } catch (Throwable $e) {
            Log::error('AI chat stream failed', [
                'user_id' => optional($request->user())->id,
                'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => $e->getMessage() ?: 'AI request failed',
            ], 503);
        }

        $content = (string) ($result['content'] ?? '');

        return new StreamedResponse(function () use ($content) {
            $chunks = preg_split('/(\s+)/u', $content, -1, PREG_SPLIT_DELIM_CAPTURE);
            foreach ($chunks as $chunk) {
                if ($chunk === '') {
                    continue;
                }
                echo 'data: '.json_encode(['delta' => $chunk])."\n\n";
                ob_flush();
                flush();
            }
            echo 'data: '.json_encode(['done' => true])."\n\n";
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
        if (! (bool) env('AI_IMAGE_ENABLED', false)) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $data = $request->validate([
            'prompt' => ['required', 'string', 'max:4000'],
            'size' => ['nullable', 'string'],
        ]);

        $startedAt = microtime(true);

        try {
            $result = $this->openai->imageGeneration($data['prompt'], [
                'size' => $data['size'] ?? null,
            ]);
        } catch (Throwable $e) {
            Log::error('AI image failed', [
                'user_id' => optional($request->user())->id,
                'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => $e->getMessage() ?: 'AI request failed',
            ], 503);
        }

        return response()
            ->json($result)
            ->header('Cache-Control', 'no-store');
    }
}
