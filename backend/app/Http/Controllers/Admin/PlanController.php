<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminActivity;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PlanController extends Controller
{
    public function index()
    {
        $query = Plan::query()->orderByDesc('created_at');

        if (request()->boolean('with_trashed')) {
            $query->withTrashed();
        }

        return response()->json($query->paginate(20));
    }

    public function publicIndex()
    {
        $plans = Plan::query()
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->orderBy('price')
            ->get([
                'id',
                'name',
                'description',
                'price',
                'billing_frequency',
                'features',
                'limits',
            ]);

        return response()->json(['data' => $plans]);
    }

    public function show($id)
    {
        $plan = Plan::withTrashed()->findOrFail($id);

        return response()->json($plan);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'billing_frequency' => ['required', 'string', 'in:monthly,yearly,custom'],
            'monthly_limit' => ['nullable', 'integer', 'min:0'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string', 'max:255'],
            'limits' => ['nullable', 'array'],
            'limits.user_count' => ['nullable', 'integer', 'min:0'],
            'limits.storage_gb' => ['nullable', 'integer', 'min:0'],
            'limits.custom' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $admin = Auth::guard('admin')->user();

        $plan = Plan::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'price' => $data['price'],
            'billing_frequency' => $data['billing_frequency'],
            'monthly_limit' => $data['monthly_limit'] ?? 0,
            'features' => $data['features'] ?? [],
            'limits' => $data['limits'] ?? [],
            'is_active' => $data['is_active'] ?? true,
        ]);

        if ($admin) {
            AdminActivity::create([
                'admin_id' => $admin->id,
                'action' => 'plan_created',
                'resource_type' => Plan::class,
                'resource_id' => $plan->id,
                'meta' => [
                    'name' => $plan->name,
                    'billing_frequency' => $plan->billing_frequency,
                ],
            ]);
        }

        return response()->json($plan, 201);
    }

    public function update(Request $request, $id)
    {
        $plan = Plan::withTrashed()->findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'billing_frequency' => ['sometimes', 'required', 'string', 'in:monthly,yearly,custom'],
            'monthly_limit' => ['nullable', 'integer', 'min:0'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string', 'max:255'],
            'limits' => ['nullable', 'array'],
            'limits.user_count' => ['nullable', 'integer', 'min:0'],
            'limits.storage_gb' => ['nullable', 'integer', 'min:0'],
            'limits.custom' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $plan->fill([
            'name' => $data['name'] ?? $plan->name,
            'description' => $data['description'] ?? $plan->description,
            'price' => $data['price'] ?? $plan->price,
            'billing_frequency' => $data['billing_frequency'] ?? $plan->billing_frequency,
            'monthly_limit' => $data['monthly_limit'] ?? $plan->monthly_limit,
            'features' => $data['features'] ?? $plan->features,
            'limits' => $data['limits'] ?? $plan->limits,
            'is_active' => $data['is_active'] ?? $plan->is_active,
        ]);

        $plan->save();

        $admin = Auth::guard('admin')->user();

        if ($admin) {
            AdminActivity::create([
                'admin_id' => $admin->id,
                'action' => 'plan_updated',
                'resource_type' => Plan::class,
                'resource_id' => $plan->id,
                'meta' => [
                    'name' => $plan->name,
                    'billing_frequency' => $plan->billing_frequency,
                ],
            ]);
        }

        return response()->json($plan);
    }

    public function destroy($id)
    {
        $plan = Plan::findOrFail($id);

        $admin = Auth::guard('admin')->user();

        $plan->delete();

        if ($admin) {
            AdminActivity::create([
                'admin_id' => $admin->id,
                'action' => 'plan_deleted',
                'resource_type' => Plan::class,
                'resource_id' => $plan->id,
                'meta' => [
                    'name' => $plan->name,
                ],
            ]);
        }

        return response()->json(['status' => 'deleted']);
    }
}
