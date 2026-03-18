<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\ChatAnalyticsController;
use App\Http\Controllers\Admin\ChatController;
use App\Http\Controllers\Admin\CostController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\LearnVideoController;
use App\Http\Controllers\Admin\PlanController;
use App\Http\Controllers\Admin\PrePromptController;
use App\Http\Controllers\Admin\PromptController;
use App\Http\Controllers\Admin\ReelController as AdminReelController;
use App\Http\Controllers\Admin\ReelModerationController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\SystemLogController;
use App\Http\Controllers\Admin\TemplateController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Api\LearnController as UserLearnController;
use App\Http\Controllers\Api\AiController as UserAiController;
use App\Http\Controllers\Api\AppSettingController as UserAppSettingController;
use App\Http\Controllers\Api\AuthController as UserAuthController;
use App\Http\Controllers\Api\ChatSessionController as UserChatSessionController;
use App\Http\Controllers\Api\PrePromptController as UserPrePromptController;
use App\Http\Controllers\Api\PromptController as UserPromptController;
use App\Http\Controllers\Api\ReelCommentController as UserReelCommentController;
use App\Http\Controllers\Api\ReelController as UserReelController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| User API Routes
|--------------------------------------------------------------------------
*/

// Public Auth
Route::post('/auth/register', [UserAuthController::class, 'register']);
Route::post('/auth/login', [UserAuthController::class, 'login']);
Route::post('/auth/google', [UserAuthController::class, 'googleLogin']);
Route::post('/auth/email/register', [UserAuthController::class, 'emailRegister']);
Route::post('/auth/email/verify', [UserAuthController::class, 'emailVerify']);
Route::post('/auth/email/resend', [UserAuthController::class, 'emailResend']);
Route::post('/auth/password/forgot', [UserAuthController::class, 'passwordForgot']);
Route::post('/auth/password/reset', [UserAuthController::class, 'passwordReset']);

// Public Data
Route::get('/plans', [PlanController::class, 'publicIndex']);
Route::get('/app-settings', [UserAppSettingController::class, 'index']);
Route::get('/app-settings/{settingKey}', [UserAppSettingController::class, 'show']);

// Protected User Routes
Route::middleware(['auth:sanctum', 'user.active'])->group(function () {
    Route::post('/auth/logout', [UserAuthController::class, 'logout']);
    Route::get('/auth/me', [UserAuthController::class, 'me']);
    Route::put('/profile', [UserAuthController::class, 'updateProfile']);
    Route::put('/profile/password', [UserAuthController::class, 'changePassword']);
    if (env('FEATURE_PHONE_OTP', false)) {
        Route::post('/auth/otp/request', [UserAuthController::class, 'requestOtp']);
        Route::post('/auth/otp/verify', [UserAuthController::class, 'verifyOtp']);
        Route::post('/auth/otp/resend', [UserAuthController::class, 'resendOtp']);
    }

    // Prompts
    Route::post('/prompts/generate', [UserPromptController::class, 'generate']);
    Route::get('/prompts', [UserPromptController::class, 'index']);

    // Chat Sessions
    Route::get('/chat-sessions', [UserChatSessionController::class, 'index']);
    Route::post('/chat-sessions', [UserChatSessionController::class, 'store']);
    Route::get('/chat-sessions/{chatSession}', [UserChatSessionController::class, 'show']);
    Route::put('/chat-sessions/{chatSession}', [UserChatSessionController::class, 'upsert']);
    Route::delete('/chat-sessions/{chatSession}', [UserChatSessionController::class, 'destroy']);

    // AI
    Route::post('/ai/chat', [UserAiController::class, 'chat']);
    Route::post('/ai/chat/stream', [UserAiController::class, 'chatStream']);
    Route::post('/ai/image', [UserAiController::class, 'image']);

    Route::get('/pre-prompts', [UserPrePromptController::class, 'index']);
    Route::get('/learn', [UserLearnController::class, 'index']);

    Route::get('/reels', [UserReelController::class, 'index']);
    Route::post('/reels/{reel}/like', [UserReelController::class, 'toggleLike']);
    Route::post('/reels/{reel}/save', [UserReelController::class, 'toggleSave']);
    Route::post('/reels/{reel}/share', [UserReelController::class, 'share']);
    Route::get('/reels/{reel}/comments', [UserReelCommentController::class, 'index']);
    Route::post('/reels/{reel}/comments', [UserReelCommentController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| Admin API Routes
|--------------------------------------------------------------------------
*/

// Admin Auth
Route::post('/admin/login', [AuthController::class, 'login']);

// Admin Routes
Route::prefix('admin')->middleware('auth:admin')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::get('/chats', [ChatController::class, 'index']);
    Route::post('/chats', [ChatController::class, 'createOrAttach']);
    Route::get('/chats/{chat}', [ChatController::class, 'show']);
    Route::post('/chats/{chat}/messages', [ChatController::class, 'sendMessage']);

    Route::get('/chat-analytics', [ChatAnalyticsController::class, 'index']);

    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}/status', [UserController::class, 'updateStatus']);
    Route::put('/users/{id}/plan', [UserController::class, 'updatePlan']);
    Route::post('/users/{id}/reset-credits', [UserController::class, 'resetCredits']);

    Route::get('/prompts', [PromptController::class, 'index']);
    Route::get('/prompts/{id}', [PromptController::class, 'show']);
    Route::put('/prompts/{id}/flag', [PromptController::class, 'flag']);

    Route::get('/ai-cost', [CostController::class, 'index']);

    Route::middleware('admin.super')->group(function () {
        Route::apiResource('plans', PlanController::class);

        Route::apiResource('templates', TemplateController::class);
        Route::apiResource('pre-prompts', PrePromptController::class)->parameters(['pre-prompts' => 'prePrompt']);
        Route::apiResource('learn', LearnVideoController::class)->parameters(['learn' => 'learnVideo']);
        Route::apiResource('reels', AdminReelController::class)->parameters(['reels' => 'reel']);
        Route::get('/reels/{reel}/comments', [ReelModerationController::class, 'comments']);
        Route::put('/reel-comments/{id}/visibility', [ReelModerationController::class, 'setCommentVisibility']);
        Route::delete('/reel-comments/{id}', [ReelModerationController::class, 'deleteComment']);
        Route::get('/reels/{reel}/likes', [ReelModerationController::class, 'likes']);
        Route::get('/reels/{reel}/saves', [ReelModerationController::class, 'saves']);
        Route::get('/reels/{reel}/shares', [ReelModerationController::class, 'shares']);

        Route::get('/system-logs', [SystemLogController::class, 'index']);

        Route::get('/settings/api-keys', [SettingsController::class, 'apiKeys']);
        Route::post('/settings/api-keys', [SettingsController::class, 'updateApiKeys']);
        Route::post('/settings/api-keys/test', [SettingsController::class, 'testApiKey']);
        Route::post('/settings/api-keys/restore', [SettingsController::class, 'restoreApiKey']);

        Route::get('/settings/app-settings', [SettingsController::class, 'appSettings']);
        Route::post('/settings/app-settings', [SettingsController::class, 'upsertAppSetting']);
        Route::post('/settings/app-settings/upload', [SettingsController::class, 'uploadAppSettingFile']);
        Route::delete('/settings/app-settings/{appSetting}', [SettingsController::class, 'deleteAppSetting']);
        Route::post('/settings/test-mail', [SettingsController::class, 'testMail']);
    });
});
