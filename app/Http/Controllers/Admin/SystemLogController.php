<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class SystemLogController extends Controller
{
    public function index()
    {
        return response()->json(DB::table('user_security_logs')->orderBy('created_at', 'desc')->paginate(50));
    }
}
