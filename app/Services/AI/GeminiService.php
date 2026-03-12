<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;

class GeminiService implements AIProviderInterface
{
    protected string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.key');
    }

    public function generate(string $prompt, array $options = []): string
    {
        // TODO: Implement Google Gemini API call
        // $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" . $this->apiKey;
        // $response = Http::post($url, [
        //     'contents' => [
        //         ['parts' => [['text' => $prompt]]]
        //     ]
        // ]);

        // return $response->json('candidates.0.content.parts.0.text');

        return "Simulated Gemini Response for: " . substr($prompt, 0, 50) . "...";
    }
}
