<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReelCommentController extends Controller
{
    public function index(Request $request, Reel $reel)
    {
        $comments = DB::table('reel_comments')
            ->join('users', 'reel_comments.user_id', '=', 'users.id')
            ->where('reel_comments.reel_id', $reel->id)
            ->where('reel_comments.is_visible', true)
            ->orderByDesc('reel_comments.created_at')
            ->get([
                'reel_comments.id',
                'reel_comments.body',
                'reel_comments.created_at',
                'users.id as user_id',
                'users.name as user_name',
                'users.avatar as user_avatar',
            ]);

        $data = $comments->map(function ($row) {
            return [
                'id' => $row->id,
                'body' => $row->body,
                'user' => [
                    'id' => (int) $row->user_id,
                    'name' => $row->user_name,
                    'avatar' => $row->user_avatar,
                ],
                'created_at' => $row->created_at ? \Illuminate\Support\Carbon::parse($row->created_at)->toIso8601String() : null,
            ];
        });

        return response()->json([
            'data' => $data,
        ]);
    }

    public function store(Request $request, Reel $reel)
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $user = $request->user();

        $result = DB::transaction(function () use ($reel, $user, $data) {
            $id = DB::table('reel_comments')->insertGetId([
                'reel_id' => $reel->id,
                'user_id' => $user->id,
                'body' => $data['body'],
                'is_visible' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('reels')
                ->where('id', $reel->id)
                ->update(['comments_count' => DB::raw('comments_count + 1')]);

            $createdAt = DB::table('reel_comments')->where('id', $id)->value('created_at');

            return [$id, $createdAt];
        });

        return response()->json([
            'data' => [
                'id' => $result[0],
                'body' => $data['body'],
                'user' => [
                    'id' => (int) $user->id,
                    'name' => $user->name,
                    'avatar' => $user->avatar,
                ],
                'created_at' => $result[1] ? \Illuminate\Support\Carbon::parse($result[1])->toIso8601String() : now()->toIso8601String(),
            ],
        ]);
    }
}

