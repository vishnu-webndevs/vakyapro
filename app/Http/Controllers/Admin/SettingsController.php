<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivity;
use App\Models\AppSetting;
use App\Models\ServiceApiKey;
use App\Models\ServiceApiKeyBackup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class SettingsController extends Controller
{
    public function apiKeys(Request $request)
    {
        if (! Schema::hasTable('service_api_keys')) {
            return response()->json([
                'openai' => [
                    'has_key' => false,
                    'last_four' => null,
                    'updated_at' => null,
                    'has_backup' => false,
                ],
                'gemini' => [
                    'has_key' => false,
                    'last_four' => null,
                    'updated_at' => null,
                    'has_backup' => false,
                ],
            ]);
        }

        $openai = ServiceApiKey::where('provider', 'openai')->first();
        $gemini = ServiceApiKey::where('provider', 'gemini')->first();

        return response()->json([
            'openai' => $this->formatKey($openai),
            'gemini' => $this->formatKey($gemini),
        ]);
    }

    public function updateApiKeys(Request $request)
    {
        $data = $request->validate([
            'openai_key' => ['nullable', 'string'],
            'gemini_key' => ['nullable', 'string'],
        ]);

        if (! $data['openai_key'] && ! $data['gemini_key']) {
            throw ValidationException::withMessages([
                'openai_key' => 'At least one API key is required.',
            ]);
        }

        $admin = Auth::guard('admin')->user();

        if ($data['openai_key']) {
            $this->assertOpenAiKeyFormat($data['openai_key']);
            $this->assertOpenAiKeyWorks($data['openai_key']);
            $this->storeKey('openai', $data['openai_key'], $admin?->id);
        }

        if ($data['gemini_key']) {
            $this->assertGeminiKeyFormat($data['gemini_key']);
            $this->assertGeminiKeyWorks($data['gemini_key']);
            $this->storeKey('gemini', $data['gemini_key'], $admin?->id);
        }

        return $this->apiKeys($request);
    }

    public function testApiKey(Request $request)
    {
        $data = $request->validate([
            'provider' => ['required', Rule::in(['openai', 'gemini'])],
            'key' => ['required', 'string'],
        ]);

        if ($data['provider'] === 'openai') {
            $this->assertOpenAiKeyFormat($data['key']);
            $this->assertOpenAiKeyWorks($data['key']);
        }

        if ($data['provider'] === 'gemini') {
            $this->assertGeminiKeyFormat($data['key']);
            $this->assertGeminiKeyWorks($data['key']);
        }

        return response()->json(['status' => 'ok']);
    }

    public function restoreApiKey(Request $request)
    {
        $data = $request->validate([
            'provider' => ['required', Rule::in(['openai', 'gemini'])],
        ]);

        $admin = Auth::guard('admin')->user();

        $current = ServiceApiKey::where('provider', $data['provider'])->first();

        if (! $current) {
            return response()->json(['message' => 'No key to restore'], 400);
        }

        $backup = ServiceApiKeyBackup::where('service_api_key_id', $current->id)
            ->latest('id')
            ->first();

        if (! $backup) {
            return response()->json(['message' => 'No backup available'], 400);
        }

        $current->update([
            'key_encrypted' => $backup->key_encrypted,
            'last_four' => $backup->last_four,
            'updated_by_admin_id' => $admin?->id,
        ]);

        if ($admin) {
            AdminActivity::create([
                'admin_id' => $admin->id,
                'action' => 'settings_api_key_restored',
                'resource_type' => ServiceApiKey::class,
                'resource_id' => $current->id,
                'meta' => [
                    'provider' => $data['provider'],
                ],
            ]);
        }

        return $this->apiKeys($request);
    }

    public function appSettings(Request $request)
    {
        if (! Schema::hasTable('app_settings')) {
            return response()->json([
                'data' => [],
            ]);
        }

        $query = AppSetting::query()->select(['id', 'setting_key', 'setting_value', 'updated_at']);

        if ($request->filled('prefix')) {
            $query->where('setting_key', 'like', $request->string('prefix').'%');
        }

        if ($request->has('keys') && is_array($request->input('keys'))) {
            $keys = array_values(array_filter($request->input('keys'), fn ($key) => is_string($key) && $key !== ''));
            if (count($keys) > 0) {
                $query->whereIn('setting_key', $keys);
            }
        }

        $settings = $query->orderBy('setting_key')->get();

        return response()->json([
            'data' => $settings,
        ]);
    }

    public function upsertAppSetting(Request $request)
    {
        if (! Schema::hasTable('app_settings')) {
            return response()->json(['message' => 'app_settings table is missing. Run migrations.'], 409);
        }

        $data = $request->validate([
            'setting_key' => ['required', 'string', 'max:255'],
            'setting_value' => ['nullable', 'string'],
        ]);

        $setting = AppSetting::updateOrCreate(
            ['setting_key' => $data['setting_key']],
            ['setting_value' => $data['setting_value'] ?? null],
        );

        $currentVersion = (int) Cache::get('app_settings:version', 1);
        Cache::put('app_settings:version', $currentVersion + 1, now()->addYears(5));

        return response()->json([
            'data' => $setting->only(['id', 'setting_key', 'setting_value', 'updated_at']),
        ]);
    }

    public function uploadAppSettingFile(Request $request)
    {
        if (! Schema::hasTable('app_settings')) {
            return response()->json(['message' => 'app_settings table is missing. Run migrations.'], 409);
        }

        $data = $request->validate([
            'file' => ['required', 'file', 'image', 'max:5120'],
            'setting_key' => ['nullable', 'string', 'max:255'],
        ]);

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg';
        $prefix = $data['setting_key'] ? preg_replace('/[^A-Za-z0-9_\-]/', '_', $data['setting_key']) : 'app_setting';
        $filename = $prefix.'_'.Str::uuid().'.'.$extension;

        $path = $file->storePubliclyAs('app-settings', $filename, 'public');
        $publicPath = '/storage/'.ltrim($path, '/');
        $baseUrl = $request->getSchemeAndHttpHost();
        $absoluteUrl = str_starts_with($publicPath, 'http://') || str_starts_with($publicPath, 'https://')
            ? $publicPath
            : rtrim($baseUrl, '/').'/'.ltrim($publicPath, '/');

        return response()->json([
            'data' => [
                'path' => $path,
                'url' => $absoluteUrl,
            ],
        ]);
    }

    public function testMail(Request $request)
    {
        $data = $request->validate([
            'to' => ['required', 'email', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['nullable', 'string', 'max:5000'],
        ]);

        $defaultMailer = (string) config('mail.default', '');
        if (in_array($defaultMailer, ['log', 'array'], true)) {
            return response()->json(['message' => 'Email service is not configured (mailer='.$defaultMailer.').'], 503);
        }

        $to = $data['to'];
        $subject = $data['subject'] ?: 'VakyaPro Test Email';
        $body = $data['message'] ?: "This is a test email from VakyaPro.\n\nIf you received this, SMTP is working.";

        try {
            $appName = (string) config('app.name', 'VakyaPro');
            $fromAddress = (string) (config('mail.from.address') ?? '');
            $fromName = (string) (config('mail.from.name') ?? $appName);

            $safeBodyHtml = nl2br(htmlspecialchars($body, ENT_QUOTES, 'UTF-8'));
            $htmlBody = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'
                .htmlspecialchars($subject, ENT_QUOTES, 'UTF-8')
                .'</title></head><body style="margin:0;background:#0b1220;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">'
                .'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;border-collapse:separate;border-spacing:0;">'
                .'<tr><td style="padding:0 0 12px 0;color:#cbd5e1;font-size:12px;">'
                .htmlspecialchars($appName, ENT_QUOTES, 'UTF-8')
                .'</td></tr>'
                .'<tr><td style="background:#0f172a;border:1px solid rgba(148,163,184,0.18);border-radius:16px;padding:24px;">'
                .'<div style="color:#e2e8f0;font-size:16px;font-weight:700;margin:0 0 6px 0;">Test Email</div>'
                .'<div style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 18px 0;">SMTP configuration check.</div>'
                .'<div style="background:#020617;border:1px solid rgba(148,163,184,0.18);border-radius:12px;padding:16px;color:#e2e8f0;font-size:13px;line-height:1.7;">'
                .$safeBodyHtml
                .'</div>'
                .'<hr style="border:none;border-top:1px solid rgba(148,163,184,0.18);margin:18px 0;">'
                .'<div style="color:#64748b;font-size:11px;line-height:1.6;">'
                .($fromAddress !== ''
                    ? ('This email was sent from '.htmlspecialchars($fromAddress, ENT_QUOTES, 'UTF-8').'. ')
                    : '')
                .'Please do not reply to this email.</div>'
                .'</td></tr>'
                .'</table></body></html>';

            Mail::send([], [], function ($message) use ($to, $subject, $fromAddress, $fromName, $htmlBody, $body) {
                $message->to($to);
                if ($fromAddress !== '') {
                    $message->from($fromAddress, $fromName);
                }
                $message->subject($subject)
                    ->text($body)
                    ->html($htmlBody);
            });
        } catch (Throwable $e) {
            Log::error('Admin test mail failed', [
                'to' => $to,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Failed to send test email.'], 503);
        }

        return response()->json(['message' => 'Test email sent']);
    }

    public function deleteAppSetting(Request $request, AppSetting $appSetting)
    {
        if (! Schema::hasTable('app_settings')) {
            return response()->json(['message' => 'app_settings table is missing. Run migrations.'], 409);
        }

        $appSetting->delete();

        $currentVersion = (int) Cache::get('app_settings:version', 1);
        Cache::put('app_settings:version', $currentVersion + 1, now()->addYears(5));

        return response()->json(['message' => 'Deleted']);
    }

    protected function formatKey(?ServiceApiKey $key): array
    {
        if (! $key) {
            return [
                'has_key' => false,
                'last_four' => null,
                'updated_at' => null,
                'has_backup' => false,
            ];
        }

        $hasBackup = ServiceApiKeyBackup::where('service_api_key_id', $key->id)->exists();

        return [
            'has_key' => true,
            'last_four' => $key->last_four,
            'updated_at' => $key->updated_at?->toIso8601String(),
            'has_backup' => $hasBackup,
        ];
    }

    protected function storeKey(string $provider, string $key, ?int $adminId): void
    {
        $existing = ServiceApiKey::where('provider', $provider)->first();

        if ($existing) {
            ServiceApiKeyBackup::create([
                'service_api_key_id' => $existing->id,
                'key_encrypted' => $existing->key_encrypted,
                'last_four' => $existing->last_four,
                'rotated_by_admin_id' => $adminId,
            ]);
        }

        $record = ServiceApiKey::updateOrCreate(
            ['provider' => $provider],
            [
                'key_encrypted' => encrypt($key),
                'last_four' => substr($key, -4),
                'created_by_admin_id' => $existing?->created_by_admin_id ?? $adminId,
                'updated_by_admin_id' => $adminId,
            ],
        );

        if ($adminId) {
            AdminActivity::create([
                'admin_id' => $adminId,
                'action' => 'settings_api_key_updated',
                'resource_type' => ServiceApiKey::class,
                'resource_id' => $record->id,
                'meta' => [
                    'provider' => $provider,
                ],
            ]);
        }
    }

    protected function assertOpenAiKeyFormat(string $key): void
    {
        if (! preg_match('/^sk-[A-Za-z0-9_\-]{20,}$/', $key)) {
            throw ValidationException::withMessages([
                'openai_key' => 'OpenAI API key format looks invalid.',
            ]);
        }
    }

    protected function assertGeminiKeyFormat(string $key): void
    {
        if (! preg_match('/^AIza[0-9A-Za-z_\-]{20,}$/', $key)) {
            throw ValidationException::withMessages([
                'gemini_key' => 'Gemini API key format looks invalid.',
            ]);
        }
    }

    protected function assertOpenAiKeyWorks(string $key): void
    {
        try {
            $response = Http::withToken($key)
                ->timeout(5)
                ->get('https://api.openai.com/v1/models');
        } catch (Throwable $e) {
            throw ValidationException::withMessages([
                'openai_key' => 'Could not reach OpenAI. Check network connectivity.',
            ]);
        }

        if (! $response->ok()) {
            throw ValidationException::withMessages([
                'openai_key' => 'OpenAI rejected this API key.',
            ]);
        }
    }

    protected function assertGeminiKeyWorks(string $key): void
    {
        $url = 'https://generativelanguage.googleapis.com/v1/models?key='.$key;

        try {
            $response = Http::timeout(5)->get($url);
        } catch (Throwable $e) {
            throw ValidationException::withMessages([
                'gemini_key' => 'Could not reach Gemini. Check network connectivity.',
            ]);
        }

        if (! $response->ok()) {
            throw ValidationException::withMessages([
                'gemini_key' => 'Gemini rejected this API key.',
            ]);
        }
    }
}
