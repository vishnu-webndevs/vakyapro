<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Reel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReelModerationController extends Controller
{
    public function comments(Request $request, Reel $reel)
    {
        $includeHidden = filter_var($request->input('include_hidden', true), FILTER_VALIDATE_BOOLEAN);
        $search = trim((string) $request->input('search', ''));

        $query = DB::table('reel_comments')
            ->join('users', 'reel_comments.user_id', '=', 'users.id')
            ->where('reel_comments.reel_id', $reel->id);

        if (! $includeHidden) {
            $query->where('reel_comments.is_visible', true);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('reel_comments.body', 'like', '%'.$search.'%')
                    ->orWhere('users.email', 'like', '%'.$search.'%')
                    ->orWhere('users.name', 'like', '%'.$search.'%');
            });
        }

        $items = $query
            ->orderByDesc('reel_comments.created_at')
            ->paginate(50, [
                'reel_comments.id',
                'reel_comments.reel_id',
                'reel_comments.user_id',
                'reel_comments.body',
                'reel_comments.is_visible',
                'reel_comments.created_at',
                'users.name as user_name',
                'users.email as user_email',
                'users.avatar as user_avatar',
                'users.is_blocked as user_is_blocked',
            ]);

        return response()->json($items);
    }

    public function setCommentVisibility(Request $request, int $id)
    {
        $data = $request->validate([
            'is_visible' => ['required', 'boolean'],
        ]);

        $row = DB::table('reel_comments')->where('id', $id)->first();
        if (! $row) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $result = DB::transaction(function () use ($row, $data) {
            $currentVisible = (bool) $row->is_visible;
            $nextVisible = (bool) $data['is_visible'];

            if ($currentVisible === $nextVisible) {
                return [$currentVisible, null];
            }

            DB::table('reel_comments')->where('id', $row->id)->update([
                'is_visible' => $nextVisible,
                'updated_at' => now(),
            ]);

            if ($nextVisible) {
                DB::table('reels')
                    ->where('id', $row->reel_id)
                    ->update(['comments_count' => DB::raw('comments_count + 1')]);
            } else {
                DB::table('reels')
                    ->where('id', $row->reel_id)
                    ->update(['comments_count' => DB::raw('CASE WHEN comments_count > 0 THEN comments_count - 1 ELSE 0 END')]);
            }

            $count = (int) DB::table('reels')->where('id', $row->reel_id)->value('comments_count');

            return [$nextVisible, $count];
        });

        return response()->json([
            'is_visible' => $result[0],
            'comments_count' => $result[1],
        ]);
    }

    public function deleteComment(int $id)
    {
        $row = DB::table('reel_comments')->where('id', $id)->first();
        if (! $row) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $count = DB::transaction(function () use ($row) {
            $wasVisible = (bool) $row->is_visible;

            DB::table('reel_comments')->where('id', $row->id)->delete();

            if ($wasVisible) {
                DB::table('reels')
                    ->where('id', $row->reel_id)
                    ->update(['comments_count' => DB::raw('CASE WHEN comments_count > 0 THEN comments_count - 1 ELSE 0 END')]);
            }

            return (int) DB::table('reels')->where('id', $row->reel_id)->value('comments_count');
        });

        return response()->json([
            'message' => 'Deleted',
            'comments_count' => $count,
        ]);
    }

    public function likes(Request $request, Reel $reel)
    {
        $items = DB::table('reel_likes')
            ->join('users', 'reel_likes.user_id', '=', 'users.id')
            ->where('reel_likes.reel_id', $reel->id)
            ->orderByDesc('reel_likes.created_at')
            ->paginate(50, [
                'reel_likes.id',
                'reel_likes.created_at',
                'users.id as user_id',
                'users.name as user_name',
                'users.email as user_email',
            ]);

        return response()->json($items);
    }

    public function saves(Request $request, Reel $reel)
    {
        $items = DB::table('reel_saves')
            ->join('users', 'reel_saves.user_id', '=', 'users.id')
            ->where('reel_saves.reel_id', $reel->id)
            ->orderByDesc('reel_saves.created_at')
            ->paginate(50, [
                'reel_saves.id',
                'reel_saves.created_at',
                'users.id as user_id',
                'users.name as user_name',
                'users.email as user_email',
            ]);

        return response()->json($items);
    }

    public function shares(Request $request, Reel $reel)
    {
        $items = DB::table('reel_shares')
            ->join('users', 'reel_shares.user_id', '=', 'users.id')
            ->where('reel_shares.reel_id', $reel->id)
            ->orderByDesc('reel_shares.created_at')
            ->paginate(50, [
                'reel_shares.id',
                'reel_shares.created_at',
                'users.id as user_id',
                'users.name as user_name',
                'users.email as user_email',
            ]);

        return response()->json($items);
    }
}

