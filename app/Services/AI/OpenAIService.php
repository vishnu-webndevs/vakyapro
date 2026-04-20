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
        $this->model = 'gpt-4o';
    }

    public function generate(string $prompt, array $options = []): string
    {
        $questionCount = (int) ($options['question_count'] ?? 0);
        $maxQuestions = 4;

        $history = $options['history'] ?? null;
        if (! is_array($history)) {
            $history = [];
        }

        $attachmentSummary = $this->extractAttachmentSummary($prompt);

        $text = mb_strtolower($prompt);

        if ($this->isRegenerateCommand($text) && $this->hasMeaningfulUserHistory($history)) {
            return $this->generateFinalPrompt('', $history);
        }

        if ($questionCount >= $maxQuestions) {
            return $this->generateFinalPrompt($prompt, $history);
        }

        if (str_contains($text, 'logo')) {
            return $this->logoQuestion($questionCount);
        }

        if ($this->looksLikeImageRequest($text)) {
            return $this->imageQuestionWithContext($questionCount, $attachmentSummary);
        }

        if ($this->looksLikeDocumentRequest($text)) {
            return $this->documentQuestion($questionCount, $attachmentSummary);
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
        return $this->imageQuestionWithContext($count, '');
    }

    protected function imageQuestionWithContext(int $count, string $context): string
    {
        $context = $this->formatShortSummary($context);
        $prefix = $context !== '' ? 'Maine aapki file me ye dekha: "'.$context."\"\n\n" : '';

        return match ($count) {
            0 => $prefix.'Theek hai. Aapko image kis purpose ke liye prompt chahiye? (logo/poster/ad/thumbnail/product)',
            1 => 'Image me main subject kya ho aur context kya ho? (1 line)',
            2 => 'Style kya ho? (realistic/anime/3D/minimal/cinematic)',
            default => 'Size/aspect ratio + constraints? (1:1/16:9 + text/no text/colors)',
        };
    }

    protected function documentQuestion(int $count, string $context = ''): string
    {
        $context = $this->formatShortSummary($context);
        $prefix = $context !== '' ? 'Maine aapke document me ye dekha: "'.$context."\"\n\n" : '';

        return match ($count) {
            0 => $prefix.'Theek hai. Aap is document/pdf ka use kis cheez ke liye karna chahte ho? (website copy, business plan, proposal, resume, email, ad etc)',
            1 => 'Target audience kaun hai aur tone kaisa chahiye? (professional/friendly/premium/Hinglish)',
            2 => 'Aapko output ka format kya chahiye? (short/long, bullets, steps, table, 1-page etc)',
            default => 'Koi must-have points ya restriction? (keywords, brand voice, language, length)',
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
            fn ($m) => ($m['role'] ?? null) === 'user'
                && is_string($m['content'] ?? null)
                && ! $this->isRegenerateCommand(mb_strtolower(trim((string) $m['content']))),
        ));

        if (empty($userMessages)) {
            $userMessages[] = ['role' => 'user', 'content' => $latestUserMessage];
        }

        // Limit the number of messages to avoid exceeding token limits
        $userMessages = array_slice($userMessages, -5);

        $joined = mb_strtolower(implode(' ', array_map(fn ($m) => $m['content'], $userMessages)));

        if (str_contains($joined, 'logo')) {
            return $this->wrapFinalPrompt($this->buildLogoPrompt($userMessages));
        }

        if ($this->looksLikeImageRequest($joined)) {
            return $this->wrapFinalPrompt($this->buildImagePrompt($userMessages));
        }

        if ($this->looksLikeDocumentRequest($joined)) {
            return $this->wrapFinalPrompt($this->buildDocumentPrompt($userMessages));
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

    protected function extractAttachmentSummary(string $prompt): string
    {
        $marker = 'attachment summary:';
        $pos = mb_stripos($prompt, $marker);
        if ($pos === false) {
            return '';
        }

        $start = $pos + mb_strlen($marker);
        $summary = trim((string) mb_substr($prompt, $start));
        if ($summary === '') {
            return '';
        }

        $summary = preg_replace('/\s+/u', ' ', $summary);
        if (! is_string($summary)) {
            return '';
        }

        return trim($summary);
    }

    protected function formatShortSummary(string $summary, int $maxLength = 220): string
    {
        $s = trim($summary);
        if ($s === '') {
            return '';
        }

        $s = preg_replace('/\s+/u', ' ', $s);
        if (! is_string($s)) {
            return '';
        }

        $s = trim($s);
        if ($s === '') {
            return '';
        }

        if (mb_strlen($s) <= $maxLength) {
            return $s;
        }

        return rtrim((string) mb_substr($s, 0, $maxLength - 1)).'…';
    }

    public function describeImage(string $dataUrl, array $options = []): string
    {
        $apiKey = $this->resolveApiKey();
        $model = is_string($options['model'] ?? null) && ($options['model'] ?? '') !== '' ? $options['model'] : $this->model;

        $payload = [
            'model' => $model,
            'messages' => [
                [
                    'role' => 'user',
                    'content' => [
                        [
                            'type' => 'text',
                            'text' => 'Read this image and extract the key information relevant to writing marketing/website/business prompts. Return a concise summary (max 8 bullet points). If it looks like a document screenshot, include any visible headings or key phrases.',
                        ],
                        [
                            'type' => 'image_url',
                            'image_url' => [
                                'url' => $dataUrl,
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $response = Http::withToken($apiKey)
            ->timeout(60)
            ->post('https://api.openai.com/v1/chat/completions', $payload);

        if (! $response->ok()) {
            $message = (string) ($response->json('error.message') ?? $response->body());
            throw new \RuntimeException($message !== '' ? $message : 'OpenAI request failed');
        }

        $json = $response->json();
        $content = (string) ($json['choices'][0]['message']['content'] ?? '');

        return trim($content);
    }

    protected function isRegenerateCommand(string $text): bool
    {
        $t = trim($text);
        if ($t === '') {
            return false;
        }

        if (str_contains($t, 'regenerate')) {
            return true;
        }

        if (str_contains($t, 're-generate')) {
            return true;
        }

        if (str_contains($t, 'phir se') || str_contains($t, 'fir se') || str_contains($t, 'dubara')) {
            return true;
        }

        if (str_contains($t, 'prompt regenerate')) {
            return true;
        }

        if (str_contains($t, 'prompt') && (str_contains($t, 'again') || str_contains($t, 'once more'))) {
            return true;
        }

        return $t === 'again' || $t === 'once more';
    }

    protected function hasMeaningfulUserHistory(array $history): bool
    {
        foreach ($history as $m) {
            if (($m['role'] ?? null) !== 'user') {
                continue;
            }
            $content = trim((string) ($m['content'] ?? ''));
            if ($content === '') {
                continue;
            }
            if ($this->isRegenerateCommand(mb_strtolower($content))) {
                continue;
            }
            return true;
        }

        return false;
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

    protected function looksLikeDocumentRequest(string $text): bool
    {
        $keywords = [
            'pdf',
            '.pdf',
            'doc',
            '.doc',
            '.docx',
            'document',
            'attachment',
            'upload',
            'uploaded',
            'file',
            'resume',
            'cv',
            'proposal',
            'contract',
            'invoice',
            'report',
            'data:application/pdf;base64',
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

    protected function buildDocumentPrompt(array $userMessages): string
    {
        $initial = $userMessages[0]['content'] ?? '';
        $useCase = $userMessages[1]['content'] ?? '';
        $audienceTone = $userMessages[2]['content'] ?? '';
        $format = $userMessages[3]['content'] ?? '';
        $constraints = $userMessages[4]['content'] ?? '';

        return sprintf(
            'You are a prompt engineer. The user has a document/pdf and wants to generate the best possible prompt. User context: %s. Use-case: %s. Audience & tone: %s. Output format: %s. Must-haves/restrictions: %s. Output: one polished prompt the user can paste into any AI model. If the document text is not provided, ask the user to paste the key parts or summary first.',
            $initial !== '' ? $initial : 'document request',
            $useCase !== '' ? $useCase : 'not specified',
            $audienceTone !== '' ? $audienceTone : 'not specified',
            $format !== '' ? $format : 'not specified',
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

    public function generateSeoBlogHtml(string $title, array $options = []): string
    {
        $title = trim($title);
        if ($title === '') {
            throw new \InvalidArgumentException('Title is required.');
        }

        $result = $this->chatCompletion([
            [
                'role' => 'system',
                'content' => 'You write SEO-friendly blog posts that feel human, natural, and helpful. Output must be valid HTML only (no markdown). Use proper headings (H2/H3 only, no H1). Avoid robotic tone. Include internal links to "/" and "/blog" where relevant.',
            ],
            [
                'role' => 'user',
                'content' => 'Write a blog post titled: "'.$title."\".\n\nRequirements:\n- 800 to 1200 words\n- SEO optimized\n- Humanized, conversational but professional\n- Include a short intro paragraph, then structured sections\n- Add a short FAQ section at the end (3-5 questions) using H2 + H3\n- Add a short conclusion with a CTA linking to /#pricing\n- Use simple HTML tags: h2,h3,p,ul,ol,li,strong,em,a,blockquote\n- Do not include any <h1>\n- Do not include <html>, <head>, or <body> tags\n- Do not mention OpenAI or AI\n\nReturn only the HTML string.",
            ],
        ], [
            'temperature' => $options['temperature'] ?? 0.7,
        ]);

        return trim((string) ($result['content'] ?? ''));
    }

    public function generatePolicyHtml(string $title, string $slug = '', array $options = []): string
    {
        $title = trim($title);
        if ($title === '') {
            throw new \InvalidArgumentException('Title is required.');
        }

        $slug = trim($slug);
        $context = $slug !== '' ? 'Page slug: '.$slug."\n" : '';
        $lowerTitle = mb_strtolower($title);
        $isPrivacyPolicy = $slug === 'privacy-policy' || str_contains($lowerTitle, 'privacy');
        $isAboutUs = $slug === 'about-us' || str_contains($lowerTitle, 'about');
        $isTerms = $slug === 'terms' || str_contains($lowerTitle, 'terms');

        if ($isPrivacyPolicy) {
            $result = $this->chatCompletion([
                [
                    'role' => 'system',
                    'content' => 'You write clear, modern privacy policies for SaaS websites in simple language. Output must be valid HTML only (no markdown). Use H2/H3 only, no H1. Keep it practical and easy to scan.',
                ],
                [
                    'role' => 'user',
                    'content' => $context.'Write a Privacy Policy page titled: "'.$title."\".\n\nCRITICAL STRUCTURE:\n- Output ONLY HTML.\n- Use these exact H2 sections in this order and numbering (10 total):\n  <h2>1. Introduction</h2>\n  <h2>2. Information We Collect</h2>\n  <h2>3. How We Use Your Information</h2>\n  <h2>4. Cookies and Tracking Technologies</h2>\n  <h2>5. Data Sharing and Third Parties</h2>\n  <h2>6. Data Security</h2>\n  <h2>7. Your Rights and Choices</h2>\n  <h2>8. International Data Transfers</h2>\n  <h2>9. Changes to This Privacy Policy</h2>\n  <h2>10. Contact Us</h2>\n\nSection requirements:\n- #2 must include H3 subsections: <h3>Personal Information</h3> and <h3>Usage Data</h3>, each with a <ul> list.\n- #3 must include two H3 subsections: <h3>Core Service Delivery</h3> and <h3>Improvements</h3>, each with a <ul> list.\n- #4 must include <h3>Types of cookies we use</h3> and a <ul> with items using <strong>Essential Cookies</strong>, <strong>Analytics Cookies</strong>, <strong>Preference Cookies</strong>.\n- #5 must include an <ol> list with three items (service providers, analytics, legal).\n- #7 must list rights as a <ul> using <strong>Access</strong>, <strong>Rectification</strong>, <strong>Deletion</strong>.\n- #10 must include a link to /contact-us.\n\nRules:\n- Use simple HTML tags only: h2,h3,p,ul,ol,li,strong,em,a,blockquote\n- Do not include any <h1>\n- Do not include <html>, <head>, or <body>\n- Do not mention OpenAI or AI\n- Keep paragraphs 1–3 sentences; keep it concise but complete\n- Include the sentence: \"We will never sell your personal data to third parties for marketing purposes.\" in section #3\n\nReturn only the HTML string.",
                ],
            ], [
                'temperature' => $options['temperature'] ?? 0.4,
            ]);

            return trim((string) ($result['content'] ?? ''));
        }

        if ($isTerms) {
            $result = $this->chatCompletion([
                [
                    'role' => 'system',
                    'content' => 'You write clear, modern Terms of Service for SaaS websites in simple language. Output must be valid HTML only (no markdown). Use H2/H3 only, no H1.',
                ],
                [
                    'role' => 'user',
                    'content' => $context.'Write a Terms of Service page titled: "'.$title."\".\n\nCRITICAL STRUCTURE:\n- Output ONLY HTML.\n- Use these H2 sections (in order):\n  <h2>1. Introduction</h2>\n  <h2>2. Using Our Service</h2>\n  <h2>3. Account Requirements</h2>\n  <h2>4. Privacy</h2>\n  <h2>5. Data Processing</h2>\n  <h2>6. Intellectual Property</h2>\n  <h2>7. License to Use the Service</h2>\n  <h2>8. User Content</h2>\n  <h2>9. Acceptable Use</h2>\n  <h2>10. Payments and Subscriptions</h2>\n  <h2>11. Termination</h2>\n  <h2>12. Disclaimers</h2>\n  <h2>13. Limitation of Liability</h2>\n  <h2>14. Changes to These Terms</h2>\n  <h2>15. Contact Us</h2>\n\nSection requirements:\n- #4 must mention the Privacy Policy is incorporated by reference.\n- #5 should state we do not sell personal data to third parties.\n- #12 must include an \"AS IS\" disclaimer.\n- #13 must include a liability cap (e.g., fees paid in the last 12 months).\n- #15 must include a link to /contact-us.\n\nRules:\n- Use simple HTML tags only: h2,h3,p,ul,ol,li,strong,em,a,blockquote\n- Do not include any <h1>\n- Do not include <html>, <head>, or <body>\n- Do not mention OpenAI or AI\n- Keep paragraphs 1–3 sentences and concise\n\nReturn only the HTML string.",
                ],
            ], [
                'temperature' => $options['temperature'] ?? 0.4,
            ]);

            return trim((string) ($result['content'] ?? ''));
        }

        if ($isAboutUs) {
            $result = $this->chatCompletion([
                [
                    'role' => 'system',
                    'content' => 'You write modern, friendly "About Us" pages for SaaS products. Output must be valid HTML only (no markdown). Use H2/H3 only, no H1. Keep copy clear, human, and concise.',
                ],
                [
                    'role' => 'user',
                    'content' => $context.'Write an About Us page titled: "'.$title."\".\n\nCRITICAL STRUCTURE (must follow exactly):\n- Output ONLY HTML.\n- Include these 6 sections, each as a <section> with the exact data-about attribute values:\n  1) <section data-about=\"hero\"> (one H2 + one short paragraph)\n  2) <section data-about=\"why\"> (one H2 + one paragraph)\n  3) <section data-about=\"who\"> (one H2 + one paragraph)\n  4) <section data-about=\"solve\"> (one H2 + one paragraph)\n  5) <section data-about=\"story-left\"> (one H2 + one H3 + one paragraph)\n  6) <section data-about=\"story-right\"> (one H2 + one H3 + one paragraph)\n\nRules:\n- Use simple HTML tags only: section,h2,h3,p,ul,ol,li,strong,em,a,blockquote\n- Do not include any <h1>\n- Do not include <html>, <head>, or <body>\n- Do not mention OpenAI or AI\n- Keep each paragraph 2–4 sentences\n- Include at least one link to \"/#features\" OR \"/#pricing\" inside the hero or solve section\n\nReturn only the HTML string.",
                ],
            ], [
                'temperature' => $options['temperature'] ?? 0.5,
            ]);

            return trim((string) ($result['content'] ?? ''));
        }

        $result = $this->chatCompletion([
            [
                'role' => 'system',
                'content' => 'You write clear website policy pages in simple language, with practical sections and headings. Output must be valid HTML only (no markdown). Use H2/H3 only, no H1.',
            ],
            [
                'role' => 'user',
                'content' => $context.'Write a complete website page titled: "'.$title."\".\n\nRequirements:\n- SEO friendly headings\n- Practical sections with H2/H3\n- Include a contact paragraph pointing to /contact-us\n- Use simple HTML tags: h2,h3,p,ul,ol,li,strong,em,a,blockquote\n- Do not include any <h1>\n- Do not include <html>, <head>, or <body>\n\nReturn only the HTML string.",
            ],
        ], [
            'temperature' => $options['temperature'] ?? 0.4,
        ]);

        return trim((string) ($result['content'] ?? ''));
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

        $fallbackKey = trim((string) config('services.openai.key', ''));

        $record = ServiceApiKey::where('provider', 'openai')->first();
        if (! $record) {
            if ($fallbackKey !== '') {
                $this->apiKey = $fallbackKey;

                return $this->apiKey;
            }

            throw new \RuntimeException('OpenAI API key not configured');
        }

        try {
            $key = (string) decrypt($record->key_encrypted);
        } catch (DecryptException $e) {
            if ($fallbackKey !== '') {
                $this->apiKey = $fallbackKey;

                return $this->apiKey;
            }

            throw new \RuntimeException('OpenAI API key cannot be decrypted. Please re-save the key.');
        }
        if ($key === '') {
            if ($fallbackKey !== '') {
                $this->apiKey = $fallbackKey;

                return $this->apiKey;
            }

            throw new \RuntimeException('OpenAI API key not configured');
        }

        $this->apiKey = $key;

        return $this->apiKey;
    }
}
