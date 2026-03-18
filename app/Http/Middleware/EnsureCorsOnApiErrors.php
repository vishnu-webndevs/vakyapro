<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class EnsureCorsOnApiErrors
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            return $next($request);
        } catch (Throwable $e) {
            // Let expected HTTP exceptions bubble up (401/403/404/422 etc.)
            if (
                $e instanceof AuthenticationException ||
                $e instanceof AuthorizationException ||
                $e instanceof ValidationException ||
                $e instanceof ModelNotFoundException ||
                $e instanceof HttpExceptionInterface
            ) {
                throw $e;
            }

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
