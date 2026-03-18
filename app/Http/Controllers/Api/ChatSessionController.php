<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class ChatSessionController extends Controller
{
    public function index(Request $request)
    {
        if (! Schema::hasTable('chat_sessions')) {
            return response()->json([
                'data' => [],
            ]);
        }

        $sessions = $request->user()
            ->chatSessions()
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json($sessions);
    }

    public function show(Request $request, ChatSession $chatSession)
    {
        if (! Schema::hasTable('chat_sessions')) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if ($chatSession->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json($chatSession);
    }

    public function store(Request $request)
    {
        if (! Schema::hasTable('chat_sessions')) {
            return response()->json(['message' => 'chat_sessions table is missing. Run migrations.'], 409);
        }

        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'messages' => ['nullable', 'array'],
        ]);

        $session = $request->user()->chatSessions()->create([
            'title' => $data['title'] ?? null,
            'messages' => $data['messages'] ?? [],
            'last_message_at' => now(),
        ]);

        return response()->json($session, 201);
    }

    public function upsert(Request $request, ChatSession $chatSession)
    {
        if (! Schema::hasTable('chat_sessions')) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if ($chatSession->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'messages' => ['nullable', 'array'],
            'last_message_at' => ['nullable', 'date'],
        ]);

        $chatSession->update([
            'title' => $data['title'] ?? $chatSession->title,
            'messages' => $data['messages'] ?? $chatSession->messages,
            'last_message_at' => isset($data['last_message_at']) ? $data['last_message_at'] : (isset($data['messages']) ? now() : $chatSession->last_message_at),
        ]);

        return response()->json($chatSession);
    }

    public function destroy(Request $request, ChatSession $chatSession)
    {
        if (! Schema::hasTable('chat_sessions')) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if ($chatSession->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $chatSession->delete();

        return response()->json(['message' => 'Deleted']);
    }
}
