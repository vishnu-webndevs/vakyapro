<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function googleLogin(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $payload = $this->verifyGoogleIdToken($request->token);

        if (! $payload || empty($payload['email'])) {
            return response()->json(['message' => 'Invalid Google Token'], 401);
        }

        $user = User::where('email', $payload['email'])->first();

        if (! $user) {
            $user = User::create([
                'name' => $payload['name'] ?? 'Google User',
                'email' => $payload['email'],
                'password' => Hash::make(Str::random(32)),
                'google_id' => $payload['sub'] ?? null,
                'avatar' => $payload['picture'] ?? null,
            ]);
        } else {
            $user->update([
                'google_id' => $payload['sub'] ?? $user->google_id,
                'avatar' => $payload['picture'] ?? $user->avatar,
            ]);
        }

        if (! empty($payload['email_verified']) && ! $user->email_verified_at) {
            $user->forceFill([
                'email_verified_at' => now(),
            ])->save();
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    private function verifyGoogleIdToken(string $token): ?array
    {
        try {
            $response = Http::timeout(5)->get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $token,
            ]);
        } catch (Throwable $e) {
            return null;
        }

        if (! $response->ok()) {
            return null;
        }

        $payload = $response->json();

        $expectedClientId = env('GOOGLE_CLIENT_ID');
        if ($expectedClientId && (($payload['aud'] ?? null) !== $expectedClientId)) {
            return null;
        }

        $issuer = $payload['iss'] ?? null;
        if ($issuer && ! in_array($issuer, ['accounts.google.com', 'https://accounts.google.com'], true)) {
            return null;
        }

        return $payload;
    }

    public function emailRegister(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        try {
            DB::beginTransaction();

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
            ]);

            $otp = $this->issueEmailOtp($user, $data['email']);

            DB::commit();
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('Email register OTP send failed', [
                'email' => $data['email'] ?? null,
                'error' => $e->getMessage(),
            ]);

            $status = $e instanceof ValidationException ? 422 : 503;
            $message = $e instanceof ValidationException
                ? $e->getMessage()
                : ($e->getMessage() ?: 'Unable to send OTP. Please try again later.');

            return response()->json(['message' => $message], $status);
        }

        $response = [
            'message' => 'OTP sent',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'expires_at' => $otp['expires_at'],
        ];

        if (app()->environment('local', 'testing')) {
            $response['otp'] = $otp['otp'];
        }

        return response()->json($response, 201);
    }

    public function emailVerify(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
            'code' => ['required', 'string', 'min:4', 'max:10'],
        ]);

        $user = User::where('email', $data['email'])->first();
        if (! $user) {
            return response()->json(['message' => 'Invalid OTP'], 422);
        }

        $otp = DB::table('email_otp_codes')
            ->where('user_id', $user->id)
            ->where('email', $data['email'])
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->orderByDesc('id')
            ->first();

        if (! $otp || ! Hash::check($data['code'], $otp->code_hash)) {
            return response()->json(['message' => 'Invalid OTP'], 422);
        }

        DB::table('email_otp_codes')->where('id', $otp->id)->update([
            'consumed_at' => now(),
            'updated_at' => now(),
        ]);

        $user->forceFill([
            'email_verified_at' => now(),
        ])->save();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Email verified',
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function emailResend(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
        ]);

        $user = User::where('email', $data['email'])->first();
        if (! $user) {
            return response()->json(['message' => 'Invalid request'], 422);
        }

        try {
            DB::beginTransaction();
            $otp = $this->issueEmailOtp($user, $data['email']);
            DB::commit();
        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('Email resend OTP send failed', [
                'email' => $data['email'] ?? null,
                'error' => $e->getMessage(),
            ]);

            $status = $e instanceof ValidationException ? 422 : 503;
            $message = $e instanceof ValidationException
                ? $e->getMessage()
                : ($e->getMessage() ?: 'Unable to send OTP. Please try again later.');

            return response()->json(['message' => $message], $status);
        }

        $response = [
            'message' => 'OTP resent',
            'expires_at' => $otp['expires_at'],
        ];

        if (app()->environment('local', 'testing')) {
            $response['otp'] = $otp['otp'];
        }

        return response()->json($response);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'avatar' => ['sometimes', 'nullable', 'string', 'max:2048'],
        ]);

        $request->user()->update($data);

        return response()->json($request->user());
    }

    public function requestOtp(Request $request)
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'max:30', Rule::unique('users', 'phone')->ignore($request->user()->id)],
        ]);

        $code = (string) random_int(100000, 999999);
        $expiresAt = now()->addMinutes(10);

        DB::table('otp_codes')->insert([
            'user_id' => $request->user()->id,
            'phone' => $data['phone'],
            'code_hash' => Hash::make($code),
            'expires_at' => $expiresAt,
            'consumed_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = [
            'message' => 'OTP sent',
            'expires_at' => $expiresAt->toIso8601String(),
        ];

        if (app()->environment('local', 'testing')) {
            $response['otp'] = $code;
        }

        return response()->json($response);
    }

    public function verifyOtp(Request $request)
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'max:30', Rule::unique('users', 'phone')->ignore($request->user()->id)],
            'code' => ['required', 'string', 'min:4', 'max:10'],
        ]);

        $otp = DB::table('otp_codes')
            ->where('user_id', $request->user()->id)
            ->where('phone', $data['phone'])
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->orderByDesc('id')
            ->first();

        if (! $otp || ! Hash::check($data['code'], $otp->code_hash)) {
            return response()->json(['message' => 'Invalid OTP'], 422);
        }

        DB::table('otp_codes')->where('id', $otp->id)->update([
            'consumed_at' => now(),
            'updated_at' => now(),
        ]);

        $request->user()->update([
            'phone' => $data['phone'],
            'phone_verified_at' => now(),
        ]);

        return response()->json([
            'message' => 'Phone verified',
            'user' => $request->user(),
        ]);
    }

    public function resendOtp(Request $request)
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'max:30', Rule::unique('users', 'phone')->ignore($request->user()->id)],
        ]);

        $code = (string) random_int(100000, 999999);
        $expiresAt = now()->addMinutes(10);

        DB::table('otp_codes')->insert([
            'user_id' => $request->user()->id,
            'phone' => $data['phone'],
            'code_hash' => Hash::make($code),
            'expires_at' => $expiresAt,
            'consumed_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = [
            'message' => 'OTP resent',
            'expires_at' => $expiresAt->toIso8601String(),
        ];

        if (app()->environment('local', 'testing')) {
            $response['otp'] = $code;
        }

        return response()->json($response);
    }

    protected function issueEmailOtp(User $user, string $email): array
    {
        $code = (string) random_int(100000, 999999);
        $expiresAt = now()->addMinutes(10);

        $defaultMailer = (string) config('mail.default', '');
        if (! app()->environment('local', 'testing') && in_array($defaultMailer, ['log', 'array'], true)) {
            throw new \RuntimeException('Email service is not configured.');
        }

        DB::table('email_otp_codes')->insert([
            'user_id' => $user->id,
            'email' => $email,
            'code_hash' => Hash::make($code),
            'expires_at' => $expiresAt,
            'consumed_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            $appName = (string) config('app.name', 'VakyaPro');
            $fromAddress = (string) (config('mail.from.address') ?? '');
            $fromName = (string) (config('mail.from.name') ?? $appName);
            $expiresMinutes = 10;

            $subject = "{$appName} Email Verification OTP";

            $textBody = "Your {$appName} OTP is: {$code}\n\nThis OTP expires in {$expiresMinutes} minutes.\n\nIf you did not request this, you can ignore this email.\n\nDo not reply to this email.";

            $htmlBody = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'
                .htmlspecialchars($subject, ENT_QUOTES, 'UTF-8')
                .'</title></head><body style="margin:0;background:#0b1220;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">'
                .'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;border-collapse:separate;border-spacing:0;">'
                .'<tr><td style="padding:0 0 12px 0;color:#cbd5e1;font-size:12px;">'
                .htmlspecialchars($appName, ENT_QUOTES, 'UTF-8')
                .'</td></tr>'
                .'<tr><td style="background:#0f172a;border:1px solid rgba(148,163,184,0.18);border-radius:16px;padding:24px;">'
                .'<div style="color:#e2e8f0;font-size:16px;font-weight:700;margin:0 0 6px 0;">Email Verification</div>'
                .'<div style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0 0 18px 0;">Use the OTP below to verify your email address.</div>'
                .'<div style="background:#020617;border:1px solid rgba(148,163,184,0.18);border-radius:12px;padding:16px;text-align:center;">'
                .'<div style="color:#94a3b8;font-size:12px;margin:0 0 6px 0;">One-time password (OTP)</div>'
                .'<div style="color:#ffffff;font-size:32px;font-weight:800;letter-spacing:6px;margin:0;">'
                .htmlspecialchars($code, ENT_QUOTES, 'UTF-8')
                .'</div>'
                .'</div>'
                .'<div style="color:#94a3b8;font-size:12px;line-height:1.6;margin:16px 0 0 0;">This OTP expires in '
                .$expiresMinutes
                .' minutes.</div>'
                .'<div style="color:#64748b;font-size:12px;line-height:1.6;margin:12px 0 0 0;">If you did not request this, you can safely ignore this email.</div>'
                .'<hr style="border:none;border-top:1px solid rgba(148,163,184,0.18);margin:18px 0;">'
                .'<div style="color:#64748b;font-size:11px;line-height:1.6;">'
                .($fromAddress !== ''
                    ? ('This email was sent from '.htmlspecialchars($fromAddress, ENT_QUOTES, 'UTF-8').'. ')
                    : '')
                .'Please do not reply to this email.</div>'
                .'</td></tr>'
                .'</table></body></html>';

            Mail::send([], [], function ($message) use ($email, $subject, $fromAddress, $fromName, $htmlBody, $textBody) {
                $message->to($email);
                if ($fromAddress !== '') {
                    $message->from($fromAddress, $fromName);
                }
                $message->subject($subject)
                    ->text($textBody)
                    ->html($htmlBody);
            });
        } catch (Throwable $e) {
            Log::error('SMTP exception while sending OTP', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
            throw new \RuntimeException('Unable to send OTP. Please try again later.');
        }

        return [
            'otp' => $code,
            'expires_at' => $expiresAt->toIso8601String(),
        ];
    }
}
