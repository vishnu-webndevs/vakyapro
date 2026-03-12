<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
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

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $otp = $this->issueEmailOtp($user, $data['email']);

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

        $otp = $this->issueEmailOtp($user, $data['email']);

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

        DB::table('email_otp_codes')->insert([
            'user_id' => $user->id,
            'email' => $email,
            'code_hash' => Hash::make($code),
            'expires_at' => $expiresAt,
            'consumed_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Mail::raw(
            "Your VakyaPro OTP is: {$code}\n\nThis OTP expires in 10 minutes.",
            function ($message) use ($email) {
                $message->to($email)->subject('VakyaPro Email Verification OTP');
            }
        );

        return [
            'otp' => $code,
            'expires_at' => $expiresAt->toIso8601String(),
        ];
    }
}
