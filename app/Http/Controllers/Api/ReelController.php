<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ReelController extends Controller
{
    public function index(Request $request)
    {
        $userId = (int) $request->user()->id;
        $savedOnly = $request->boolean('saved_only');
        $version = (int) Cache::get('reels:version', 1);
        $cacheKey = 'reels:index:'.$version.':user:'.$userId.':saved_only:'.($savedOnly ? '1' : '0');

        $data = Cache::remember($cacheKey, now()->addSeconds(10), function () use ($savedOnly, $userId) {
            $query = Reel::query()
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
                    'shares_count',
                    'comments_count',
                    'created_at',
                ])
                ->addSelect([
                    'is_liked' => DB::raw('EXISTS (select 1 from reel_likes where reel_likes.reel_id = reels.id and reel_likes.user_id = '.(int) $userId.')'),
                    'is_saved' => DB::raw('EXISTS (select 1 from reel_saves where reel_saves.reel_id = reels.id and reel_saves.user_id = '.(int) $userId.')'),
                    'is_shared' => DB::raw('EXISTS (select 1 from reel_shares where reel_shares.reel_id = reels.id and reel_shares.user_id = '.(int) $userId.')'),
                ]);

            if ($savedOnly) {
                $query->whereExists(function ($q) use ($userId) {
                    $q->select(DB::raw(1))
                        ->from('reel_saves')
                        ->whereColumn('reel_saves.reel_id', 'reels.id')
                        ->where('reel_saves.user_id', $userId);
                });
            }

            $reels = $query->get();

            return $reels->map(function ($reel) {
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
                    'shares_count' => (int) ($reel->shares_count ?? 0),
                    'comments_count' => (int) $reel->comments_count,
                    'is_liked' => (bool) $reel->is_liked,
                    'is_saved' => (bool) $reel->is_saved,
                    'is_shared' => (bool) ($reel->is_shared ?? false),
                    'created_at' => $reel->created_at?->toIso8601String(),
                ];
            })->values();
        });

        return response()
            ->json(['data' => $data])
            ->header('Cache-Control', 'private, max-age=10');
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

    public function share(Request $request, Reel $reel)
    {
        $userId = (int) $request->user()->id;

        $result = DB::transaction(function () use ($reel, $userId) {
            DB::table('reel_shares')->insert([
                'reel_id' => $reel->id,
                'user_id' => $userId,
                'created_at' => now(),
            ]);

            DB::table('reels')
                ->where('id', $reel->id)
                ->update(['shares_count' => DB::raw('shares_count + 1')]);

            $sharesCount = (int) DB::table('reels')->where('id', $reel->id)->value('shares_count');

            return $sharesCount;
        });

        return response()->json([
            'shared' => true,
            'shares_count' => $result,
        ]);
    }

    public function view(Request $request, Reel $reel)
    {
        $data = $request->validate([
            'watch_duration_ms' => ['nullable', 'integer', 'min:0', 'max:86400000'],
            'is_completed' => ['nullable', 'boolean'],
        ]);

        $userId = (int) $request->user()->id;
        $watchMs = (int) ($data['watch_duration_ms'] ?? 0);
        $isCompleted = (bool) ($data['is_completed'] ?? false);

        $result = DB::transaction(function () use ($reel, $userId, $watchMs, $isCompleted) {
            DB::table('reel_view_events')->insert([
                'reel_id' => $reel->id,
                'user_id' => $userId,
                'watch_duration_ms' => $watchMs,
                'is_completed' => $isCompleted,
                'created_at' => now(),
            ]);

            $updates = [
                'watch_time_ms' => DB::raw('watch_time_ms + '.(int) $watchMs),
            ];

            $minMs = (int) env('WATCH_VIEW_MIN_MS', 1000);
            if ($watchMs >= $minMs) {
                $updates['views_count'] = DB::raw('views_count + 1');
            }

            DB::table('reels')->where('id', $reel->id)->update($updates);

            return [
                'views_count' => (int) DB::table('reels')->where('id', $reel->id)->value('views_count'),
                'watch_time_ms' => (int) DB::table('reels')->where('id', $reel->id)->value('watch_time_ms'),
            ];
        });

        return response()->json([
            'views_count' => $result['views_count'],
            'watch_time_ms' => $result['watch_time_ms'],
        ]);
    }
}
