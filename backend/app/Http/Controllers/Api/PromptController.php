<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AI\OpenAIService;
use Illuminate\Http\Request;
use Smalot\PdfParser\Parser;
use Throwable;

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
            'attachments' => 'nullable|array|max:3',
            'attachments.*.mime' => 'required_with:attachments|string',
            'attachments.*.data' => 'required_with:attachments|string',
            'attachments.*.name' => 'nullable|string',
        ]);

        try {
            $rawPrompt = (string) $request->input('prompt');
            $attachmentSummary = '';

            $attachments = $request->input('attachments', []);
            if (is_array($attachments) && ! empty($attachments)) {
                $summaryParts = [];

                foreach ($attachments as $attachment) {
                    if (! is_array($attachment)) {
                        continue;
                    }

                    $mime = is_string($attachment['mime'] ?? null) ? $attachment['mime'] : '';
                    $data = is_string($attachment['data'] ?? null) ? $attachment['data'] : '';
                    $name = is_string($attachment['name'] ?? null) ? $attachment['name'] : '';

                    if ($mime === '' || $data === '') {
                        continue;
                    }

                    if (str_starts_with($data, 'data:application/pdf') || $mime === 'application/pdf') {
                        $text = $this->extractPdfTextFromDataUrl($data);
                        if ($text !== '') {
                            $label = $name !== '' ? $name : 'PDF';
                            $summaryParts[] = $label.': '.$text;
                        }
                        continue;
                    }

                    if (str_starts_with($data, 'data:image/') || str_starts_with($mime, 'image/')) {
                        try {
                            $imageSummary = $this->aiService->describeImage($data);
                            if ($imageSummary !== '') {
                                $label = $name !== '' ? $name : 'Image';
                                $summaryParts[] = $label.': '.$imageSummary;
                            }
                        } catch (Throwable $e) {
                        }
                        continue;
                    }
                }

                if (! empty($summaryParts)) {
                    $attachmentSummary = implode("\n", $summaryParts);
                }
            }

            $finalPrompt = $rawPrompt;
            if ($attachmentSummary !== '') {
                $finalPrompt .= "\n\nAttachment summary:\n".$attachmentSummary;
            }

            $options = [
                'history' => $request->input('history', []),
                'question_count' => $request->input('question_count', 0),
            ];

            $result = $this->aiService->generate($finalPrompt, $options);

            // Save to history if user is authenticated
            if ($request->user()) {
                $request->user()->prompts()->create([
                    'original_prompt' => $rawPrompt,
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

    protected function extractPdfTextFromDataUrl(string $dataUrl): string
    {
        $base64 = $dataUrl;
        if (str_starts_with($dataUrl, 'data:')) {
            $commaPos = strpos($dataUrl, ',');
            if ($commaPos === false) {
                return '';
            }
            $base64 = substr($dataUrl, $commaPos + 1);
        }

        $base64 = trim($base64);
        if ($base64 === '') {
            return '';
        }

        $binary = base64_decode($base64, true);
        if (! is_string($binary) || $binary === '') {
            return '';
        }

        $tmp = tempnam(sys_get_temp_dir(), 'vp_pdf_');
        if (! is_string($tmp) || $tmp === '') {
            return '';
        }

        $tmpPdf = $tmp.'.pdf';
        @unlink($tmp);

        $written = @file_put_contents($tmpPdf, $binary);
        if ($written === false) {
            @unlink($tmpPdf);
            return '';
        }

        try {
            $parser = new Parser();
            $pdf = $parser->parseFile($tmpPdf);
            $text = (string) $pdf->getText();
        } catch (Throwable $e) {
            @unlink($tmpPdf);
            return '';
        }

        @unlink($tmpPdf);

        $text = preg_replace('/\s+/u', ' ', $text);
        if (! is_string($text)) {
            return '';
        }

        $text = trim($text);
        if ($text === '') {
            return '';
        }

        $maxLen = 2000;
        if (mb_strlen($text) > $maxLen) {
            $text = rtrim((string) mb_substr($text, 0, $maxLen - 1)).'…';
        }

        return $text;
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
