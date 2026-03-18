<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogSlowRequests
{
    public function handle(Request $request, Closure $next): Response
    {
        $thresholdMs = (int) env('SLOW_REQUEST_MS', 5000);
        $startedAt = microtime(true);
        $dbTimeMs = 0.0;
        $dbCount = 0;

        DB::listen(function ($query) use (&$dbTimeMs, &$dbCount) {
            $dbCount++;
            $dbTimeMs += (float) ($query->time ?? 0);
        });

        $response = $next($request);

        $durationMs = (int) round((microtime(true) - $startedAt) * 1000);
        if ($durationMs >= $thresholdMs) {
            $adminId = Auth::guard('admin')->id();
            $userId = optional($request->user())->id;

            Log::warning('Slow request', [
                'method' => $request->method(),
                'path' => $request->path(),
                'status' => method_exists($response, 'getStatusCode') ? $response->getStatusCode() : null,
                'duration_ms' => $durationMs,
                'db_ms' => (int) round($dbTimeMs),
                'db_count' => $dbCount,
                'user_id' => $userId,
                'admin_id' => $adminId,
                'memory_peak_mb' => (int) round(memory_get_peak_usage(true) / 1024 / 1024),
            ]);
        }

        return $response;
    }
}

