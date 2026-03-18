<?php

namespace App\Services\AI;

use App\Models\ServiceApiKey;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Http;

class OpenAIService implements AIProviderInterface
{
    protected string $apiKey;

    protected string $model;

    public function __construct()
    {
        $this->apiKey = '';
        $this->model = 'gpt-4o-mini';
    }

    public function generate(string $prompt, array $options = []): string
    {
        $questionCount = (int) ($options['question_count'] ?? 0);
        $maxQuestions = 4;

        $history = $options['history'] ?? null;
        if (! is_array($history)) {
            $history = [];
        }

        if ($questionCount >= $maxQuestions) {
            return $this->generateFinalPrompt($prompt, $history);
        }

        $text = mb_strtolower($prompt);

        if (str_contains($text, 'logo')) {
            return $this->logoQuestion($questionCount);
        }

        if ($this->looksLikeImageRequest($text)) {
            return $this->imageQuestion($questionCount);
        }

        if ($this->looksLikeNamingRequest($text)) {
            return $this->namingQuestion($questionCount);
        }

        if (str_contains($text, 'trip') || str_contains($text, 'travel')) {
            return $this->tripQuestion($questionCount);
        }

        if (str_contains($text, 'bug') || str_contains($text, 'error') || str_contains($text, 'issue')) {
            return $this->debugQuestion($questionCount);
        }

        return $this->genericQuestion($questionCount);
    }

    protected function logoQuestion(int $count): string
    {
        return match ($count) {
            0 => 'Theek hai. Aapko kis brand/product ke liye logo prompt chahiye?',
            1 => 'Audience kaun hai? (kids/teens/business/local etc)',
            2 => 'Style kaisa chahiye? (minimal/bold/premium/playful)',
            default => 'Colors pasand? 2–3 colors ya “no preference”',
        };
    }

    protected function imageQuestion(int $count): string
    {
        return match ($count) {
            0 => 'Theek hai. Aapko image kis purpose ke liye chahiye? (logo/poster/ad/thumbnail/product)',
            1 => 'Image me main subject kya ho aur context kya ho? (1 line)',
            2 => 'Style kya ho? (realistic/anime/3D/minimal/cinematic)',
            default => 'Size/aspect ratio + constraints? (1:1/16:9 + text/no text/colors)',
        };
    }

    protected function namingQuestion(int $count): string
    {
        return match ($count) {
            0 => 'Theek hai. Ye name kis cheez ke liye chahiye? (app/site/business/product)',
            1 => 'Aapka niche/industry kya hai? (example: clothing, salon, edtech)',
            2 => 'Name ka vibe kaisa ho? (short/catchy/premium/funny)',
            default => 'Color preference? 2–3 colors ya “no preference”',
        };
    }

    protected function tripQuestion(int $count): string
    {
        return match ($count) {
            0 => 'Theek hai. Aap kaha se kaha ja rahe ho?',
            1 => 'Dates ya month? (example: 12–15 April / April end)',
            2 => 'Budget: low / mid / high?',
            default => 'Travel style: relaxed / packed / balanced?',
        };
    }

    protected function debugQuestion(int $count): string
    {
        return match ($count) {
            0 => 'Theek hai. Ye kis tech/framework me hai? (Laravel/Flutter/React etc)',
            1 => 'Exact error message ya status code kya aa raha hai?',
            2 => 'Ye issue kis step/endpoint par aata hai?',
            default => 'Pehle ye kaam karta tha? (yes/no)',
        };
    }

    protected function genericQuestion(int $count): string
    {
        return match ($count) {
            0 => 'Theek hai. Aapko kiske liye prompt chahiye? (logo/image/post/email etc)',
            1 => 'Ye kis audience ke liye hai?',
            2 => 'Final output me aapko kya mile to “done” maanoge? (1 line)',
            default => 'Koi must-have ya restriction? (example: Hindi only, short, formal)',
        };
    }

    protected function generateFinalPrompt(string $latestUserMessage, array $history): string
    {
        $userMessages = array_values(array_filter(
            $history,
            fn ($m) => ($m['role'] ?? null) === 'user' && is_string($m['content'] ?? null),
        ));

        if (empty($userMessages)) {
            $userMessages[] = ['role' => 'user', 'content' => $latestUserMessage];
        }

        $joined = mb_strtolower(implode(' ', array_map(fn ($m) => $m['content'], $userMessages)));

        if (str_contains($joined, 'logo')) {
            return $this->wrapFinalPrompt($this->buildLogoPrompt($userMessages));
        }

        if ($this->looksLikeImageRequest($joined)) {
            return $this->wrapFinalPrompt($this->buildImagePrompt($userMessages));
        }

        if ($this->looksLikeNamingRequest($joined)) {
            return $this->wrapFinalPrompt($this->buildNamingPrompt($userMessages));
        }

        if (str_contains($joined, 'trip') || str_contains($joined, 'travel')) {
            return $this->wrapFinalPrompt($this->buildTripPrompt($userMessages));
        }

        if (str_contains($joined, 'bug') || str_contains($joined, 'error') || str_contains($joined, 'issue')) {
            return $this->wrapFinalPrompt($this->buildDebugPrompt($userMessages));
        }

        return $this->wrapFinalPrompt($this->buildGenericPrompt($userMessages));
    }

    protected function wrapFinalPrompt(string $prompt): string
    {
        return "Here is your prompt\n\n".$prompt;
    }

    protected function looksLikeImageRequest(string $text): bool
    {
        $keywords = [
            'image',
            'photo',
            'picture',
            'poster',
            'banner',
            'thumbnail',
            'illustration',
            'art',
            'generate image',
            'ai image',
            'midjourney',
            'stable diffusion',
        ];

        foreach ($keywords as $kw) {
            if (str_contains($text, $kw)) {
                return true;
            }
        }

        return false;
    }

    protected function looksLikeNamingRequest(string $text): bool
    {
        $hasNameIntent = str_contains($text, 'username')
            || str_contains($text, 'user name')
            || str_contains($text, 'name')
            || str_contains($text, 'naam');

        if (! $hasNameIntent) {
            return false;
        }

        return str_contains($text, 'site')
            || str_contains($text, 'website')
            || str_contains($text, 'web')
            || str_contains($text, 'app')
            || str_contains($text, 'brand')
            || str_contains($text, 'business')
            || str_contains($text, 'company')
            || str_contains($text, 'store')
            || str_contains($text, 'product');
    }

    protected function buildLogoPrompt(array $userMessages): string
    {
        $initial = $userMessages[0]['content'] ?? '';
        $brand = $userMessages[1]['content'] ?? '';
        $audience = $userMessages[2]['content'] ?? '';
        $style = $userMessages[3]['content'] ?? '';
        $constraints = $userMessages[4]['content'] ?? '';

        return sprintf(
            'Create logo for "%s". Target audience: %s. Style: %s. Colors/constraints: %s. Output: 3 distinct logo concepts with visual style notes, color suggestions, typography direction, and usage guidelines, ready for a designer or image model.',
            $brand !== '' ? $brand : ($initial !== '' ? $initial : 'the brand'),
            $audience !== '' ? $audience : 'general customers',
            $style !== '' ? $style : 'clean, modern',
            $constraints !== '' ? $constraints : 'no hard constraints mentioned',
        );
    }

    protected function buildImagePrompt(array $userMessages): string
    {
        $initial = $userMessages[0]['content'] ?? '';
        $purpose = $userMessages[1]['content'] ?? '';
        $subject = $userMessages[2]['content'] ?? '';
        $style = $userMessages[3]['content'] ?? '';
        $constraints = $userMessages[4]['content'] ?? '';

        return sprintf(
            'Create a high-quality image generation prompt. Request: %s. Purpose: %s. Main subject & context: %s. Style: %s. Size/aspect & constraints: %s. Output: one polished prompt suitable for any image model.',
            $initial !== '' ? $initial : 'image request',
            $purpose !== '' ? $purpose : 'not specified',
            $subject !== '' ? $subject : 'not specified',
            $style !== '' ? $style : 'not specified',
            $constraints !== '' ? $constraints : 'not specified',
        );
    }

    protected function buildTripPrompt(array $userMessages): string
    {
        $initial = $userMessages[0]['content'] ?? '';
        $leg1 = $userMessages[1]['content'] ?? '';
        $dates = $userMessages[2]['content'] ?? '';
        $budget = $userMessages[3]['content'] ?? '';
        $style = $userMessages[4]['content'] ?? '';

        return sprintf(
            'You are a senior travel planner. Plan an itinerary based on: %s. Route/details: %s. Dates/season: %s. Budget: %s. Travel style: %s. Output: a day-by-day schedule with activities, suggested timings, transport tips, and budget ranges, suitable to paste into an AI assistant.',
            $initial,
            $leg1,
            $dates,
            $budget !== '' ? $budget : 'mid',
            $style !== '' ? $style : 'balanced',
        );
    }

    protected function buildNamingPrompt(array $userMessages): string
    {
        $initial = $userMessages[0]['content'] ?? '';
        $whatFor = $userMessages[1]['content'] ?? '';
        $industry = $userMessages[2]['content'] ?? '';
        $vibe = $userMessages[3]['content'] ?? '';
        $colors = $userMessages[4]['content'] ?? '';

        return sprintf(
            'You are a branding expert. Generate name options based on: %s. For: %s. Industry/niche: %s. Vibe: %s. Color preference: %s. Output: 20 name ideas (short + memorable), 5 tagline ideas, and 3 color palette suggestions (HEX) that match the vibe.',
            $initial,
            $whatFor !== '' ? $whatFor : 'app/site/business',
            $industry !== '' ? $industry : 'not specified',
            $vibe !== '' ? $vibe : 'modern',
            $colors !== '' ? $colors : 'no preference',
        );
    }

    protected function buildDebugPrompt(array $userMessages): string
    {
        $initial = $userMessages[0]['content'] ?? '';
        $stack = $userMessages[1]['content'] ?? '';
        $error = $userMessages[2]['content'] ?? '';
        $trigger = $userMessages[3]['content'] ?? '';
        $history = $userMessages[4]['content'] ?? '';

        return sprintf(
            'Act as a senior engineer. Help debug this issue. Context: %s. Stack/framework: %s. Error message or code: %s. Trigger: %s. History (worked before?): %s. Output: a structured debugging plan with likely causes, concrete checks, and example commands/snippets.',
            $initial,
            $stack,
            $error,
            $trigger,
            $history,
        );
    }

    protected function buildGenericPrompt(array $userMessages): string
    {
        $initial = $userMessages[0]['content'] ?? '';
        $goal = $userMessages[1]['content'] ?? '';
        $audience = $userMessages[2]['content'] ?? '';
        $success = $userMessages[3]['content'] ?? '';
        $constraints = $userMessages[4]['content'] ?? '';

        return sprintf(
            'You are an expert AI assistant. Based on this request: %s. Refine it into a high-quality prompt. Goal: %s. Audience: %s. Success criteria: %s. Constraints: %s. Output: a single, polished prompt the user can paste into any AI model.',
            $initial,
            $goal !== '' ? $goal : 'achieve the user’s objective clearly',
            $audience !== '' ? $audience : 'the user’s target audience',
            $success !== '' ? $success : 'useful, precise, and easy to follow output',
            $constraints !== '' ? $constraints : 'no special constraints',
        );
    }

    public function chatCompletion(array $messages, array $options = []): array
    {
        $apiKey = $this->resolveApiKey();
        $model = is_string($options['model'] ?? null) && ($options['model'] ?? '') !== '' ? $options['model'] : $this->model;
        $temperature = $options['temperature'] ?? null;

        $payload = [
            'model' => $model,
            'messages' => $messages,
        ];

        if (is_numeric($temperature)) {
            $payload['temperature'] = (float) $temperature;
        }

        $response = Http::withToken($apiKey)
            ->timeout(60)
            ->post('https://api.openai.com/v1/chat/completions', $payload);

        if (! $response->ok()) {
            $message = (string) ($response->json('error.message') ?? $response->body());
            throw new \RuntimeException($message !== '' ? $message : 'OpenAI request failed');
        }

        $json = $response->json();
        $content = (string) ($json['choices'][0]['message']['content'] ?? '');

        return [
            'content' => $content,
            'raw' => $json,
        ];
    }

    public function imageGeneration(string $prompt, array $options = []): array
    {
        $apiKey = $this->resolveApiKey();
        $size = is_string($options['size'] ?? null) && ($options['size'] ?? '') !== '' ? $options['size'] : '1024x1024';

        $response = Http::withToken($apiKey)
            ->timeout(120)
            ->post('https://api.openai.com/v1/images/generations', [
                'model' => 'gpt-image-1',
                'prompt' => $prompt,
                'size' => $size,
            ]);

        if (! $response->ok()) {
            $message = (string) ($response->json('error.message') ?? $response->body());
            throw new \RuntimeException($message !== '' ? $message : 'OpenAI image request failed');
        }

        return $response->json();
    }

    protected function resolveApiKey(): string
    {
        if ($this->apiKey !== '') {
            return $this->apiKey;
        }

        $record = ServiceApiKey::where('provider', 'openai')->first();
        if (! $record) {
            throw new \RuntimeException('OpenAI API key not configured');
        }

        try {
            $key = (string) decrypt($record->key_encrypted);
        } catch (DecryptException $e) {
            throw new \RuntimeException('OpenAI API key cannot be decrypted. Please re-save the key.');
        }
        if ($key === '') {
            throw new \RuntimeException('OpenAI API key not configured');
        }

        $this->apiKey = $key;

        return $this->apiKey;
    }
}
