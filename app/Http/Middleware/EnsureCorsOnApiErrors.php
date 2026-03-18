<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class EnsureCorsOnApiErrors
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            return $next($request);
        } catch (Throwable $e) {
            report($e);

            $origin = (string) $request->headers->get('Origin', '');
            $allowedOrigins = (array) config('cors.allowed_origins', []);
            $allowOrigin = in_array($origin, $allowedOrigins, true) ? $origin : null;

            Log::error('Unhandled API exception', [
                'method' => $request->method(),
                'path' => $request->path(),
                'origin' => $origin ?: null,
                'message' => $e->getMessage(),
                'exception' => $e::class,
            ]);

            $response = response()->json(['message' => 'Internal Server Error'], 500);

            if ($allowOrigin) {
                $response->headers->set('Access-Control-Allow-Origin', $allowOrigin);
                $response->headers->set('Vary', 'Origin', false);
            }

            return $response;
        }
    }
}

