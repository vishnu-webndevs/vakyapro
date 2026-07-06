<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class PromptController extends Controller
{
    public function index()
    {
        $prompts = DB::table('prompts')
            ->join('users', 'prompts.user_id', '=', 'users.id')
            ->select('prompts.*', 'users.name as user_name', 'users.email')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($prompts);
    }

    public function show($id)
    {
        $prompt = DB::table('prompts')
            ->leftJoin('ai_responses', 'prompts.id', '=', 'ai_responses.prompt_id')
            ->where('prompts.id', $id)
            ->first();

        return response()->json($prompt);
    }

    public function flag($id)
    {
        // TODO: Implement content flagging
    }
}
