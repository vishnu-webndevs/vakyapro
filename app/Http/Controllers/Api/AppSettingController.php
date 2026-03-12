<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\Request;

class AppSettingController extends Controller
{
    public function index(Request $request)
    {
        $query = AppSetting::query()->select(['setting_key', 'setting_value']);

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

    public function show(string $settingKey)
    {
        $setting = AppSetting::query()
            ->where('setting_key', $settingKey)
            ->select(['setting_key', 'setting_value'])
            ->first();

        if (! $setting) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        return response()->json([
            'data' => $setting,
        ]);
    }
}
