<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivity;
use App\Models\AppSetting;
use App\Models\ServiceApiKey;
use App\Models\ServiceApiKeyBackup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class SettingsController extends Controller
{
    public function apiKeys(Request $request)
    {
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

        return response()->json([
            'data' => $setting->only(['id', 'setting_key', 'setting_value', 'updated_at']),
        ]);
    }

    public function deleteAppSetting(Request $request, AppSetting $appSetting)
    {
        if (! Schema::hasTable('app_settings')) {
            return response()->json(['message' => 'app_settings table is missing. Run migrations.'], 409);
        }

        $appSetting->delete();

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
