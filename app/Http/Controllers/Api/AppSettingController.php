<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class AppSettingController extends Controller
{
    public function index(Request $request)
    {
        if (! Schema::hasTable('app_settings')) {
            return response()->json([
                'data' => [],
            ]);
        }

        $prefix = $request->filled('prefix') ? (string) $request->string('prefix') : null;
        $keys = [];
        if ($request->has('keys') && is_array($request->input('keys'))) {
            $keys = array_values(array_filter($request->input('keys'), fn ($key) => is_string($key) && $key !== ''));
            sort($keys);
        }

        $version = (int) Cache::get('app_settings:version', 1);
        $cacheKey = 'app_settings:index:'.$version.':'.sha1(json_encode([
            'prefix' => $prefix,
            'keys' => $keys,
        ]));

        $settings = Cache::remember($cacheKey, now()->addSeconds(60), function () use ($prefix, $keys) {
            $query = AppSetting::query()->select(['setting_key', 'setting_value']);

            if ($prefix !== null && $prefix !== '') {
                $query->where('setting_key', 'like', $prefix.'%');
            }

            if (count($keys) > 0) {
                $query->whereIn('setting_key', $keys);
            }

            return $query->orderBy('setting_key')->get();
        });

        return response()->json([
            'data' => $settings,
        ])->header('Cache-Control', 'public, max-age=60');
    }

    public function show(string $settingKey)
    {
        if (! Schema::hasTable('app_settings')) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $version = (int) Cache::get('app_settings:version', 1);
        $cacheKey = 'app_settings:show:'.$version.':'.$settingKey;

        $setting = Cache::remember($cacheKey, now()->addSeconds(60), function () use ($settingKey) {
            return AppSetting::query()
                ->where('setting_key', $settingKey)
                ->select(['setting_key', 'setting_value'])
                ->first();
        });

        if (! $setting) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return response()->json([
            'data' => $setting,
        ])->header('Cache-Control', 'public, max-age=60');
    }
}
