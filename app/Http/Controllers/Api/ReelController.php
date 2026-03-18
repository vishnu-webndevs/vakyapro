<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReelController extends Controller
{
    public function index(Request $request)
    {
        $userId = (int) $request->user()->id;

        $reels = Reel::query()
            ->where('is_active', true)
            ->orderBy('order')
            ->orderByDesc('created_at')
            ->select([
                'id',
                'title',
                'description',
                'prompt',
                'video_url',
                'thumbnail_url',
                'views_count',
                'likes_count',
                'saves_count',
                'comments_count',
                'created_at',
            ])
            ->addSelect([
                'is_liked' => DB::raw('EXISTS (select 1 from reel_likes where reel_likes.reel_id = reels.id and reel_likes.user_id = '.(int) $userId.')'),
                'is_saved' => DB::raw('EXISTS (select 1 from reel_saves where reel_saves.reel_id = reels.id and reel_saves.user_id = '.(int) $userId.')'),
            ])
            ->get();

        $data = $reels->map(function ($reel) {
            return [
                'id' => $reel->id,
                'title' => $reel->title,
                'description' => $reel->description,
                'prompt' => $reel->prompt,
                'video_url' => $reel->video_url,
                'thumbnail_url' => $reel->thumbnail_url,
                'views_count' => (int) $reel->views_count,
                'likes_count' => (int) $reel->likes_count,
                'saves_count' => (int) $reel->saves_count,
                'comments_count' => (int) $reel->comments_count,
                'is_liked' => (bool) $reel->is_liked,
                'is_saved' => (bool) $reel->is_saved,
                'created_at' => $reel->created_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'data' => $data,
        ]);
    }

    public function toggleLike(Request $request, Reel $reel)
    {
        $userId = (int) $request->user()->id;

        $result = DB::transaction(function () use ($reel, $userId) {
            $exists = DB::table('reel_likes')
                ->where('reel_id', $reel->id)
                ->where('user_id', $userId)
                ->exists();

            if (! $exists) {
                DB::table('reel_likes')->insert([
                    'reel_id' => $reel->id,
                    'user_id' => $userId,
                    'created_at' => now(),
                ]);

                DB::table('reels')
                    ->where('id', $reel->id)
                    ->update(['likes_count' => DB::raw('likes_count + 1')]);

                $liked = true;
            } else {
                DB::table('reel_likes')
                    ->where('reel_id', $reel->id)
                    ->where('user_id', $userId)
                    ->delete();

                DB::table('reels')
                    ->where('id', $reel->id)
                    ->update(['likes_count' => DB::raw('CASE WHEN likes_count > 0 THEN likes_count - 1 ELSE 0 END')]);

                $liked = false;
            }

            $likesCount = (int) DB::table('reels')->where('id', $reel->id)->value('likes_count');

            return [$liked, $likesCount];
        });

        return response()->json([
            'liked' => $result[0],
            'likes_count' => $result[1],
        ]);
    }

    public function toggleSave(Request $request, Reel $reel)
    {
        $userId = (int) $request->user()->id;

        $result = DB::transaction(function () use ($reel, $userId) {
            $exists = DB::table('reel_saves')
                ->where('reel_id', $reel->id)
                ->where('user_id', $userId)
                ->exists();

            if (! $exists) {
                DB::table('reel_saves')->insert([
                    'reel_id' => $reel->id,
                    'user_id' => $userId,
                    'created_at' => now(),
                ]);

                DB::table('reels')
                    ->where('id', $reel->id)
                    ->update(['saves_count' => DB::raw('saves_count + 1')]);

                $saved = true;
            } else {
                DB::table('reel_saves')
                    ->where('reel_id', $reel->id)
                    ->where('user_id', $userId)
                    ->delete();

                DB::table('reels')
                    ->where('id', $reel->id)
                    ->update(['saves_count' => DB::raw('CASE WHEN saves_count > 0 THEN saves_count - 1 ELSE 0 END')]);

                $saved = false;
            }

            $savesCount = (int) DB::table('reels')->where('id', $reel->id)->value('saves_count');

            return [$saved, $savesCount];
        });

        return response()->json([
            'saved' => $result[0],
            'saves_count' => $result[1],
        ]);
    }
}

