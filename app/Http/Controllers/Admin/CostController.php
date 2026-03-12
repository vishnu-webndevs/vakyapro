<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CostController extends Controller
{
    public function index()
    {
        $costs = DB::table('ai_cost_logs')
            ->select(
                DB::raw('SUM(cost) as total_cost'),
                DB::raw('SUM(tokens_input) as total_input'),
                DB::raw('SUM(tokens_output) as total_output'),
                'provider',
                'model'
            )
            ->groupBy('provider', 'model')
            ->get();

        return response()->json($costs);
    }
}
