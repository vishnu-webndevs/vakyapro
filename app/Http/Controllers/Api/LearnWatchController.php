<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LearnVideo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LearnWatchController extends Controller
{
    public function view(Request $request, LearnVideo $learnVideo)
    {
        $data = $request->validate([
            'watch_duration_ms' => ['nullable', 'integer', 'min:0', 'max:86400000'],
            'is_completed' => ['nullable', 'boolean'],
        ]);

        $userId = (int) $request->user()->id;
        $watchMs = (int) ($data['watch_duration_ms'] ?? 0);
        $isCompleted = (bool) ($data['is_completed'] ?? false);

        $result = DB::transaction(function () use ($learnVideo, $userId, $watchMs, $isCompleted) {
            DB::table('learn_video_view_events')->insert([
                'learn_video_id' => $learnVideo->id,
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

            DB::table('learn_videos')->where('id', $learnVideo->id)->update($updates);

            return [
                'views_count' => (int) DB::table('learn_videos')->where('id', $learnVideo->id)->value('views_count'),
                'watch_time_ms' => (int) DB::table('learn_videos')->where('id', $learnVideo->id)->value('watch_time_ms'),
            ];
        });

        return response()->json([
            'views_count' => $result['views_count'],
            'watch_time_ms' => $result['watch_time_ms'],
        ]);
    }
}
