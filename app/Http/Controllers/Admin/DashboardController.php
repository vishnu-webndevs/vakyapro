<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

class DashboardController extends Controller
{
    public function index()
    {
        return response()->json([
            'total_users' => 12540,
            'active_today' => 1820,
            'prompts_today' => 5421,
            'tokens_today' => 1245000,
            'estimated_cost_today' => 182.45,
            'avg_response_time_ms' => 820,
        ]);
    }
}
