<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use App\Models\ChatMessage;
use Illuminate\Support\Facades\DB;

class ChatAnalyticsController extends Controller
{
    public function index()
    {
        $totalChats = Chat::count();
        $openChats = Chat::where('status', 'open')->count();
        $closedChats = Chat::where('status', 'closed')->count();

        $messagesToday = ChatMessage::whereDate('created_at', today())->count();
        $impersonatedMessages = ChatMessage::where('impersonated', true)->count();

        $messagesPerDay = ChatMessage::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as total')
        )
            ->groupBy('date')
            ->orderByDesc('date')
            ->limit(14)
            ->get();

        return response()->json([
            'total_chats' => $totalChats,
            'open_chats' => $openChats,
            'closed_chats' => $closedChats,
            'messages_today' => $messagesToday,
            'impersonated_messages' => $impersonatedMessages,
            'messages_per_day' => $messagesPerDay,
        ]);
    }
}

