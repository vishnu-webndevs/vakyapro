<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivity;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::with('plan')->paginate(20));
    }

    public function show($id)
    {
        return response()->json(User::with(['plan', 'usage_logs'])->findOrFail($id));
    }

    public function updateStatus(Request $request, $id)
    {
        $data = $request->validate([
            'is_blocked' => ['required', 'boolean'],
            'blocked_reason' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::with('plan')->findOrFail($id);
        $wasBlocked = (bool) ($user->is_blocked ?? false);

        $user->is_blocked = (bool) $data['is_blocked'];
        $user->blocked_reason = $data['is_blocked'] ? ($data['blocked_reason'] ?? null) : null;
        $user->blocked_at = $data['is_blocked'] ? now() : null;
        $user->save();

        if ($data['is_blocked'] && ! $wasBlocked) {
            $user->tokens()->delete();
        }

        $admin = Auth::guard('admin')->user();
        if ($admin) {
            AdminActivity::create([
                'admin_id' => $admin->id,
                'action' => $data['is_blocked'] ? 'user_blocked' : 'user_unblocked',
                'resource_type' => User::class,
                'resource_id' => $user->id,
                'meta' => [
                    'user_email' => $user->email,
                    'blocked_reason' => $user->blocked_reason,
                ],
            ]);
        }

        return response()->json($user);
    }

    public function updatePlan(Request $request, $id)
    {
        $data = $request->validate([
            'plan_id' => ['nullable', 'integer', 'exists:plans,id'],
        ]);

        $user = User::with('plan')->findOrFail($id);

        $newPlan = null;

        if (array_key_exists('plan_id', $data)) {
            if ($data['plan_id'] === null) {
                $user->plan_id = null;
            } else {
                $newPlan = Plan::query()
                    ->where('id', $data['plan_id'])
                    ->whereNull('deleted_at')
                    ->where('is_active', true)
                    ->first();

                if (! $newPlan) {
                    return response()->json([
                        'message' => 'Selected plan is not available.',
                    ], 422);
                }

                $user->plan_id = $newPlan->id;

                if ($newPlan->monthly_limit !== null) {
                    $user->credits = $newPlan->monthly_limit;
                }
            }
        }

        $user->save();

        $admin = Auth::guard('admin')->user();

        if ($admin) {
            AdminActivity::create([
                'admin_id' => $admin->id,
                'action' => 'user_plan_changed',
                'resource_type' => User::class,
                'resource_id' => $user->id,
                'meta' => [
                    'user_email' => $user->email,
                    'plan_id' => $newPlan?->id,
                    'plan_name' => $newPlan?->name,
                ],
            ]);
        }

        return response()->json($user->load('plan'));
    }

    public function resetCredits($id)
    {
        $user = User::with('plan')->findOrFail($id);

        $plan = $user->plan;

        if (! $plan || $plan->monthly_limit === null) {
            return response()->json([
                'message' => 'User does not have a plan with a monthly limit.',
            ], 422);
        }

        $user->credits = $plan->monthly_limit;
        $user->save();

        $admin = Auth::guard('admin')->user();

        if ($admin) {
            AdminActivity::create([
                'admin_id' => $admin->id,
                'action' => 'user_credits_reset',
                'resource_type' => User::class,
                'resource_id' => $user->id,
                'meta' => [
                    'user_email' => $user->email,
                    'plan_id' => $plan->id,
                    'plan_name' => $plan->name,
                    'credits' => $user->credits,
                ],
            ]);
        }

        return response()->json([
            'status' => 'ok',
            'credits' => $user->credits,
        ]);
    }
}
